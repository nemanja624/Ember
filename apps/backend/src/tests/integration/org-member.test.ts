import { describe, test, beforeEach, afterAll, expect } from "vitest";
import { prisma } from "../../shared/prisma.js";
import { getMyOrganization, getOrganizationById, updateOrganization } from "../../org/org.service.js";
import { inviteMember } from "../../member/member.service.js";

async function createTestUser(overrides: Partial<Parameters<typeof prisma.user.create>[0]["data"]> = {}) {
  return await prisma.user.create({
    data: {
      name: "Test User",
      email: `user_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`,
      passwordHash: "hashedPassword123",
      ...overrides,
    },
  });
}

async function createTestOrg(overrides: Partial<Parameters<typeof prisma.organization.create>[0]["data"]> = {}) {
  return await prisma.organization.create({
    data: {
      name: "Test Organization",
      slug: `test-org-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      ...overrides,
    },
  });
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

describe("Organization & Member Integration Tests", () => {
  describe("Organization Service", () => {
    test("should create an organization, add a user, and fetch the organization", async () => {
      const user = await createTestUser({
        email: "test_org_owner@example.com",
        name: "John Doe",
      });

      const org = await createTestOrg({
        name: "Test Org",
        slug: "test-org",
      });

      await prisma.orgMembership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: "OWNER",
        },
      });

      const myOrg = await getMyOrganization(user.id, org.id);
      const fetchedOrg = await getOrganizationById(org.id);

      expect(myOrg.id).toBe(org.id);
      expect(myOrg.name).toBe("Test Org");
      expect(fetchedOrg.id).toBe(org.id);
      expect(fetchedOrg.memberships).toHaveLength(1);
      expect(fetchedOrg.memberships[0]?.user.email).toBe("test_org_owner@example.com");
    });

    test("should throw error if user has no membership in organization", async () => {
      const user = await createTestUser();
      const org = await createTestOrg();

      await expect(getMyOrganization(user.id, org.id)).rejects.toThrow("USER_HAS_NO_ORGANIZATION");
    });

    test("should throw error if organization by ID does not exist", async () => {
      await expect(getOrganizationById("non-existent-id")).rejects.toThrow("ORGANIZATION_NOT_FOUND");
    });

    test("should update organization details", async () => {
      const org = await createTestOrg({ name: "Old Name", slug: "old-name" });

      const updatedOrg = await updateOrganization(org.id, { name: "New Name" });

      expect(updatedOrg.name).toBe("New Name");

      const checkDb = await prisma.organization.findUnique({
        where: { id: org.id },
      });

      expect(checkDb?.name).toBe("New Name");
    });
  });

  describe("Member Service (inviteMember)", () => {
    test("should successfully invite an existing user to an organization", async () => {
      const org = await createTestOrg({ name: "Invite Org", slug: "invite-org" });

      const userToInvite = await createTestUser({
        email: "invite@example.com",
        name: "Invite Me",
      });

      const membership = await inviteMember(org.id, {
        email: "invite@example.com",
        role: "ADMIN",
      });

      expect(membership.userId).toBe(userToInvite.id);
      expect(membership.organizationId).toBe(org.id);
      expect(membership.role).toBe("ADMIN");

      const membershipInDb = await prisma.orgMembership.findFirst({
        where: { userId: userToInvite.id, organizationId: org.id },
      });

      expect(membershipInDb).not.toBeNull();
      expect(membershipInDb?.role).toBe("ADMIN");
    });

    test("should throw error if trying to invite a user that does not exist", async () => {
      const org = await createTestOrg({ name: "My Org", slug: "my-org" });

      await expect(
        inviteMember(org.id, { email: "nonexistent@example.com", role: "MEMBER" })
      ).rejects.toThrow("USER_NOT_FOUND");
    });

    test("should throw error if user is already a member", async () => {
      const org = await createTestOrg({ name: "My Org", slug: "my-org" });

      const user = await createTestUser({ email: "member@example.com" });

      await prisma.orgMembership.create({
        data: { userId: user.id, organizationId: org.id, role: "MEMBER" },
      });

      await expect(
        inviteMember(org.id, { email: "member@example.com", role: "MEMBER" })
      ).rejects.toThrow("MEMBER_ALREADY_EXISTS");
    });
  });
});