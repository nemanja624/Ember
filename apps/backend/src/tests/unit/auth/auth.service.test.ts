import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockDeep, type DeepMockProxy } from "vitest-mock-extended";
import bcrypt from "bcrypt";
import { PrismaClient } from "../../../../generated/prisma/client.js";
import { prisma } from "../../../shared/prisma.js";
import { registerUser } from "../../../auth/auth.service.js";

// 1. Popravljena putanja da se tačno poklapa sa importom (.js)
vi.mock("../../../shared/prisma.js", () => ({
    prisma: mockDeep<PrismaClient>(),
}));

vi.mock("bcrypt");

vi.mock("../../../shared/jwt.js", () => ({
    signAccessToken: vi.fn(),
    signRefreshToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
    // 2. Zamena za mockReset(prismaMock) koja ne puca
    vi.resetAllMocks();
});

describe("registerUser", () => {
    test("throws USER_ALREADY_EXISTS if the email is already taken", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1" } as any);

    await expect(registerUser("a@b.com", "password123", "Nemanja", "ACME")).rejects.toThrow("USER_ALREADY_EXISTS");
    });

    test("creates a user, an organization, and an OWNER membership", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);

    const fakeUser = { id: "u1", email: "a@b.com", passwordHash: "hashed-password", name: "Nemanja" };
    const fakeOrg = { id: "org1", name: "Acme", slug: "acme" };

    (prismaMock.$transaction as any).mockImplementation((callback: any) => callback(prismaMock));
    prismaMock.user.create.mockResolvedValue(fakeUser as any);
    prismaMock.organization.create.mockResolvedValue(fakeOrg as any);
    prismaMock.orgMembership.create.mockResolvedValue({} as any);

    const result = await registerUser("a@b.com", "password123", "Nemanja", "Acme");

    expect(result).toEqual({ user: fakeUser, organization: fakeOrg });
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);

    // 3. Ispravljen poziv - proverava se šta je stvarno poslato u organization.create
    expect(prismaMock.organization.create).toHaveBeenCalledWith({
        data: { name: "Acme", slug: "acme" },
    });

    // Provera za membership
    expect(prismaMock.orgMembership.create).toHaveBeenCalledWith({
        data: { organizationId: "org1", userId: "u1", role: "OWNER" },
    });
});

  test("turns the organization name into a lowercase, dash-separated slug", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
    (prismaMock.$transaction as any).mockImplementation((callback: any) => callback(prismaMock));
    prismaMock.user.create.mockResolvedValue({ id: "u1" } as any);
    prismaMock.organization.create.mockResolvedValue({ id: "org1" } as any);
    prismaMock.orgMembership.create.mockResolvedValue({} as any);

    await registerUser("a@b.com", "password123", "Nemanja", " My New Company ");

    expect(prismaMock.organization.create).toHaveBeenCalledWith({
      data: { name: " My New Company ", slug: "my-new-company" },
    });
  });
});