import { beforeEach, describe, expect, test, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import bcrypt from "bcrypt";
import { prisma } from "../../shared/prisma.js";

beforeEach(async () => {
  await prisma.monitor.deleteMany({});
  await prisma.orgMembership.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Auth Integration Tests", () => {
  describe("POST /api/auth/login", () => {
    test("successful login, sets HttpOnly cookie and returns accessToken", async () => {
      const passwordHash = await bcrypt.hash("Password123!", 10);

      const org = await prisma.organization.create({
        data: {
          name: "Dev Org",
          slug: "dev-org",
        },
      });

      const user = await prisma.user.create({
        data: {
          email: "dev@ember.com",
          passwordHash,
          name: "Dev User",
          memberships: {
            create: {
              organizationId: org.id,
              role: "OWNER",
            },
          },
        },
      });

      const response = await request(app).post("/api/auth/login").send({
        email: "dev@ember.com",
        password: "Password123!",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("accessToken");

      const cookies = response.headers["set-cookie"];

      expect(cookies).toBeDefined();
      expect(cookies?.[0]).toContain("refreshToken=");
      expect(cookies?.[0]).toContain("HttpOnly");
    });

    test("returns 401 when the password is incorrect", async () => {
      await prisma.user.create({
        data: {
          email: "dev@ember.com",
          passwordHash: await bcrypt.hash("CorrectPassword123!", 10),
          name: "Dev User",
        },
      });

      const response = await request(app).post("/api/auth/login").send({
        email: "dev@ember.com",
        password: "WrongPassword123!",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "INVALID_CREDENTIALS" });
    });
  });

  describe("POST /api/auth/register", () => {
    test("successfully registers user and organization inside transaction", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "new@ember.com",
        password: "Password123!",
        name: "New Dev",
        organizationName: "Ember Org",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("email", "new@ember.com");

      const dbUser = await prisma.user.findUnique({
        where: { email: "new@ember.com" },
        include: { memberships: true },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.memberships).toHaveLength(1);
    });

    test("returns 409 if user already exists", async () => {
      await prisma.user.create({
        data: {
          email: "dev@ember.com",
          passwordHash: "hashedPassword",
          name: "Existing User",
        },
      });

      const response = await request(app).post("/api/auth/register").send({
        email: "dev@ember.com",
        password: "Password123!",
        name: "Existing User",
        organizationName: "Ember Org",
      });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: "USER_ALREADY_EXISTS" });
    });
  });
});
