import { beforeEach, describe, expect, test, vi } from "vitest";
import request from "supertest";
import { app } from "../../../app.js";
import bcrypt from "bcrypt";
import { prisma } from "../../../shared/prisma.js";
import { mockDeep, type DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient } from "../../../../generated/prisma/client.js";

vi.mock("../../../shared/prisma.js", async() => {
    const vitestMockExtended = await import("vitest-mock-extended");
    return {
        prisma: vitestMockExtended.mockDeep(),
    };
});

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe("Auth Integration Tests", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    describe("POST /api/auth/login", () => {
      test("successful login, sets HttpOnly cookie and returns accessToken", async () => {
        const fakeUser = {
          id: "user-123",
          email: "dev@ember.com",
          passwordHash: await bcrypt.hash("Password123!", 10),
          memberships: [{ organizationId: "org-123", role: "OWNER" }],
        };

        prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);

        const response = await request(app)
          .post("/api/auth/login")
          .send({
            email: "dev@ember.com",
            password: "Password123!",
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("accessToken");

        const cookies = response.headers["set-cookie"];

        expect(cookies).toBeDefined();
        expect(cookies?.[0]).toContain("refreshToken=");
        expect(cookies?.[0]).toContain("HttpOnly");

        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
          where: { email: "dev@ember.com" },
          include: { memberships: true },
        });
      });

      test("returns 401 inside error-handler when the password in incorrect", async () => {
          prismaMock.user.findUnique.mockResolvedValue({
              id: "user-123",
              email: "dev@ember.com",
              passwordHash: await bcrypt.hash("CorrectPassword123!", 10),
              memberships: [{ organizationId: "org-123", role: "OWNER" }],
          } as any);

          const response = await request(app)
              .post("/api/auth/login")
              .send({
                  email: "dev@ember.com",
                  password: "WrongPassword123!",
              });

          expect(response.status).toBe(401);
          expect(response.body).toEqual({ error: "INVALID_CREDENTIALS" });
      });
    });

    describe("POST /api/auth/refresh", () => {
      test("successfully refreshes token when a valid cookie is sent", async () => {
          const { issueTokenPair } = await import("../../../shared/jwt.js");
          const { refreshToken } = issueTokenPair({
              userId: "user-123",
              organizationId: "org-123",
              role: "OWNER",
          });

          const response = await request(app)
            .post("/api/auth/refresh")
            .set("Cookie", [`refreshToken=${refreshToken}`]);

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty("accessToken");
      });

      test("returns 401 if a cookie is missing", async () => {
          const response = await request(app).post("/api/auth/refresh");

          expect(response.status).toBe(401);
          expect(response.body).toEqual({ error: "REFRESH_TOKEN_INVALID" });
      });
    });

    describe("POST /api/auth/register", () => {
      test("successfully registers user and organization inside transaction", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Mockovanje prisma.$transaction callback-a
      prismaMock.$transaction.mockImplementation(async (cb: any) => {
        return cb({
          user: { create: vi.fn().mockResolvedValue({ id: "user-999", email: "new@ember.com", name: "New Dev" }) },
          organization: { create: vi.fn().mockResolvedValue({ id: "org-999", name: "Ember Org", slug: "ember-org" }) },
          orgMembership: { create: vi.fn().mockResolvedValue({ id: "mem-999", role: "OWNER" }) },
        });
      });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "new@ember.com",
          password: "Password123!",
          name: "New Dev",
          organizationName: "Ember Org",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id", "user-999");
      expect(response.body).toHaveProperty("email", "new@ember.com");
      });

      test("returns 409 if user already exists", async () => {
        prismaMock.user.findUnique.mockResolvedValue({
          id: "existing-123",
          email: "dev@ember.com",
        } as any);

        const response = await request(app)
          .post("/api/auth/register")
          .send({
            email: "dev@ember.com",
            password: "Password123!",
            name: "Existing User",
            organizationName: "Ember Org",
          });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: "USER_ALREADY_EXISTS" });
      });
    });

    describe("GET /api/auth/me", () => {
      test("returns user profile when valid accessToken is provided in Authorization header", async () => {
        const { issueTokenPair } = await import("../../../shared/jwt.js");
        const { accessToken } = issueTokenPair({
          userId: "user-123",
          organizationId: "org-123",
          role: "OWNER",
        });

        prismaMock.user.findUnique.mockResolvedValue({
          id: "user-123",
          name: "Dev Ember",
        } as any);

        const response = await request(app)
          .get("/api/auth/me")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(
          expect.objectContaining({
            id: "user-123",
            name: "Dev Ember",
          })
        );
      });

      test("returns 401 when Authorization header is missing", async () => {
        const response = await request(app).get("/api/auth/me");

        expect(response.status).toBe(401);
      });
    });
});
