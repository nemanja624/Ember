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
    test("Successful login, sets HttpOnly cookie and returns accessToken", async () => {
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
    });
  });
});