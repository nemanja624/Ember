import { beforeEach, describe, expect, test, vi } from "vitest";
import { mockDeep, type DeepMockProxy } from "vitest-mock-extended";
import bcrypt from "bcrypt";
import { PrismaClient } from "../../../../generated/prisma/client.js";
import { prisma } from "../../../shared/prisma.js";
import { loginUser, refreshTokens, registerUser } from "../../../auth/auth.service.js";
import { issueTokenPair, verifyRefreshToken } from "../../../shared/jwt.js";

// creates a fake object that acts as PrismaClient
vi.mock("../../../shared/prisma.js", () => ({
    prisma: mockDeep<PrismaClient>(),
}));

vi.mock("bcrypt");

vi.mock("../../../shared/jwt.js", () => ({
    signAccessToken: vi.fn(),
    signRefreshToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
    issueTokenPair: vi.fn(),
}));

// tells TS that PrismaClient uses vi.fn() mock in methods
const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
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

        expect(prismaMock.organization.create).toHaveBeenCalledWith({
            data: { name: "Acme", slug: "acme" },
        });

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

describe("loginUser", () => {
    test("throws INVALID_CREDENTIALS if the user doesn't exist", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        await expect(loginUser("a@b.com", "password123")).rejects.toThrow("INVALID_CREDENTIALS");
    });

    test("throws INVALID_CREDENTIALS if the password doesn't match", async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: "u1",
            passwordHash: "hashed",
            memberships: [{ organizationId: "org1", role: "OWNER" }],
        } as any);

        vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

        await expect(loginUser("a@b.com", "password123")).rejects.toThrow("INVALID_CREDENTIALS");
    });

    test("throws USER_HAS_NO_ORGANIZATION if the user has no membership", async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: "u1",
            passwordHash: "hashed",
            memberships: [],
        } as any);

        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

        await expect(loginUser("a@b.com", "password123")).rejects.toThrow("USER_HAS_NO_ORGANIZATION");
    });

    test("returns an access and refresh token on successful login", async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: "u1",
            passwordHash: "hashed",
            memberships: [{ organizationId: "org1", role: "OWNER" }],
        } as any);

        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
        vi.mocked(issueTokenPair).mockReturnValue({ accessToken: "access-token-123", refreshToken: "refresh-token-123" });

        const result = await loginUser("a@b.com", "password123");

        expect(result).toEqual({ accessToken: "access-token-123", refreshToken: "refresh-token-123" }); 
    });

    test("issues a new access and refresh token from a valid refresh token", async () => {
        vi.mocked(verifyRefreshToken).mockReturnValue({ userId: "u1", organizationId: "o1", role: "OWNER" });
        vi.mocked(issueTokenPair).mockReturnValue({ accessToken: "new-access", refreshToken: "new-refresh" });

        const tokens = refreshTokens("old-refresh-token");

        expect(tokens).toEqual({ accessToken: "new-access", refreshToken: "new-refresh" });
    });
});
