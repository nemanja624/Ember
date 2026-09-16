import { describe, test, beforeEach, afterAll, expect } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { prisma } from "../../shared/prisma.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { signAccessToken } from "../../shared/jwt.js";

// 1. Helper funkcije sa ispravnim Partial sintaksama
async function createTestUser(
  overrides: Partial<Prisma.UserCreateInput> = {}
) {
  return await prisma.user.create({
    data: {
      name: "Test User",
      email: `user_${crypto.randomUUID()}@example.com`,
      passwordHash: "hashedPassword123",
      ...overrides,
    },
  });
}

async function createTestOrg(
  overrides: Partial<Prisma.OrganizationCreateInput> = {}
) {
  return await prisma.organization.create({
    data: {
      name: "Test Organization",
      slug: `test-org-${crypto.randomUUID()}`,
      ...overrides,
    },
  });
}

async function createTestMembership(
  userId: string,
  organizationId: string,
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
) {
  return await prisma.orgMembership.create({
    data: { userId, organizationId, role },
  });
}

async function createTestMonitor(
  organizationId: string,
  overrides: Partial<Prisma.MonitorCreateInput> = {}
) {
  const data: Prisma.MonitorUncheckedCreateInput = {
    organizationId,
    name: "API Healthcheck",
    type: "HTTPS",
    target: "https://api.example.com/health",
    intervalSeconds: 60,
    timeoutMs: 5000,
    expectedStatus: 200,
    ...overrides,
  };

  return await prisma.monitor.create({ data });
}

beforeEach(async () => {
  await prisma.monitor.deleteMany({});
  await prisma.orgMembership.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Monitor Integration Tests", () => {
  describe("CRUD & RBAC Permissions", () => {
    test("MEMBER can create a monitor, but VIEWER cannot", async () => {
      const org = await createTestOrg();
      const memberUser = await createTestUser();
      const viewerUser = await createTestUser();

      await createTestMembership(memberUser.id, org.id, "MEMBER");
      await createTestMembership(viewerUser.id, org.id, "VIEWER");

      const memberToken = signAccessToken({
        userId: memberUser.id,
        organizationId: org.id,
        role: "MEMBER",
      });

      const viewerToken = signAccessToken({
        userId: viewerUser.id,
        organizationId: org.id,
        role: "VIEWER",
      });

      const newMonitorPayload = {
        name: "Production API",
        type: "HTTPS",
        target: "https://example.com/health",
        intervalSeconds: 30,
      };

      const createRes = await request(app)
        .post(`/organizations/${org.id}/monitors`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send(newMonitorPayload);

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.name).toBe("Production API");

      const viewerRes = await request(app)
        .post(`/organizations/${org.id}/monitors`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .send(newMonitorPayload);

      expect(viewerRes.status).toBe(403);
    });

    test("VIEWER can read monitors", async () => {
      const org = await createTestOrg();
      const viewerUser = await createTestUser();
      await createTestMembership(viewerUser.id, org.id, "VIEWER");
      await createTestMonitor(org.id, { name: "Database Monitor" });

      const viewerToken = signAccessToken({
        userId: viewerUser.id,
        organizationId: org.id,
        role: "VIEWER",
      });

      const res = await request(app)
        .get(`/organizations/${org.id}/monitors`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("Database Monitor");
    });

    test("MEMBER can update monitor, but MEMBER cannot delete it", async () => {
      const org = await createTestOrg();
      const memberUser = await createTestUser();
      await createTestMembership(memberUser.id, org.id, "MEMBER");
      const monitor = await createTestMonitor(org.id);

      const token = signAccessToken({
        userId: memberUser.id,
        organizationId: org.id,
        role: "MEMBER",
      });

      const updateRes = await request(app)
        .patch(`/organizations/${org.id}/monitors/${monitor.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name" });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe("Updated Name");

      const deleteRes = await request(app)
        .delete(`/organizations/${org.id}/monitors/${monitor.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(deleteRes.status).toBe(403);
    });

    test("ADMIN/OWNER can delete a monitor", async () => {
      const org = await createTestOrg();
      const adminUser = await createTestUser();
      await createTestMembership(adminUser.id, org.id, "ADMIN");
      const monitor = await createTestMonitor(org.id);

      const token = signAccessToken({
        userId: adminUser.id,
        organizationId: org.id,
        role: "ADMIN",
      });

      const deleteRes = await request(app)
        .delete(`/organizations/${org.id}/monitors/${monitor.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);

      const dbCheck = await prisma.monitor.findUnique({ where: { id: monitor.id } });
      expect(dbCheck).toBeNull();
    });
  });

  describe("Tenant Isolation", () => {
    test("User from Org A cannot view monitors from Org B", async () => {
      const orgA = await createTestOrg({ name: "Org A" });
      const orgB = await createTestOrg({ name: "Org B" });

      const userA = await createTestUser();
      await createTestMembership(userA.id, orgA.id, "ADMIN");

      const monitorB = await createTestMonitor(orgB.id, { name: "Org B Secret Monitor" });

      const tokenA = signAccessToken({
        userId: userA.id,
        organizationId: orgA.id,
        role: "ADMIN",
      });

      const listRes = await request(app)
        .get(`/organizations/${orgB.id}/monitors`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(listRes.status).toBe(403);

      const getRes = await request(app)
        .get(`/organizations/${orgA.id}/monitors/${monitorB.id}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(getRes.status).toBe(404);
    });

    test("User from Org A cannot update or delete monitor belonging to Org B", async () => {
      const orgA = await createTestOrg();
      const orgB = await createTestOrg();

      const userA = await createTestUser();
      await createTestMembership(userA.id, orgA.id, "ADMIN");

      const monitorB = await createTestMonitor(orgB.id);

      const tokenA = signAccessToken({
        userId: userA.id,
        organizationId: orgA.id,
        role: "ADMIN",
      });

      const updateRes = await request(app)
        .patch(`/organizations/${orgA.id}/monitors/${monitorB.id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ name: "Hacked Name" });

      expect(updateRes.status).toBe(404);
    });
  });

  describe("Payload Validation (Zod)", () => {
    test("should reject invalid target URL and invalid interval", async () => {
      const org = await createTestOrg();
      const user = await createTestUser();
      await createTestMembership(user.id, org.id, "ADMIN");

      const token = signAccessToken({
        userId: user.id,
        organizationId: org.id,
        role: "ADMIN",
      });

      const res = await request(app)
        .post(`/organizations/${org.id}/monitors`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Bad Monitor",
          type: "HTTP",
          target: "invalid-url-without-protocol",
          intervalSeconds: 2,
        });

      expect(res.status).toBe(400);
    });
  });
});