import { describe, test, beforeEach, expect, vi } from "vitest";
import { mockDeep, type DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient } from "../../../../generated/prisma/client.js";
import { prisma } from "../../../shared/prisma.js";
import { getMyOrganization, getOrganizationById, updateOrganization } from "../../../org/org.service.js";
import { inviteMember } from "../../../org/member.service.js";

vi.mock("../../../shared/prisma.js", () => ({
    prisma: mockDeep<PrismaClient>(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
    vi.resetAllMocks();
});

describe("getMyOrganization", () => {
    test("throws USER_HAS_NO_ORGANIZATION if organization is not found", async () => {
        prismaMock.orgMembership.findFirst.mockResolvedValue(null);
        prismaMock.orgMembership.findUnique.mockResolvedValue(null);
        prismaMock.organization.findFirst.mockResolvedValue(null);
        prismaMock.organization.findUnique.mockResolvedValue(null);

        await expect(getMyOrganization("non-existent-user-id", "org-123")).rejects.toThrow("USER_HAS_NO_ORGANIZATION");
    });

    test("returns the organization when given a valid userId and organizationId", async () => {
        const fakeOrg = {
            id: "org-123",
            name: "Acme Corp",
            slug: "acme-corp",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const fakeMembership = {
            id: "mem-1",
            userId: "user-123",
            organizationId: "org-123",
            organization: fakeOrg,
        };

        // Mockujemo i findFirst i findUnique za obojicu (orgMembership i organization)
        prismaMock.orgMembership.findFirst.mockResolvedValue(fakeMembership as any);
        prismaMock.orgMembership.findUnique.mockResolvedValue(fakeMembership as any);
        prismaMock.organization.findFirst.mockResolvedValue(fakeOrg as any);
        prismaMock.organization.findUnique.mockResolvedValue(fakeOrg as any);

        const result = await getMyOrganization("user-123", "org-123");

        expect(result).toEqual(fakeOrg);
    });
});

describe("getOrganizationById", () => {
    test("throws ORGANIZATION_NOT_FOUND if organization with given ID does not exist", async () => {
        prismaMock.organization.findUnique.mockResolvedValue(null);

        await expect(getOrganizationById("invalid-id")).rejects.toThrow("ORGANIZATION_NOT_FOUND");
    });

    test("returns organization details by ID", async () => {
        const fakeOrg = { id: "org-123", name: "Ember", slug: "ember" };
        prismaMock.organization.findUnique.mockResolvedValue(fakeOrg as any);

        const result = await getOrganizationById("org-123");

        expect(result).toEqual(fakeOrg);
        expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
            where: { id: "org-123" },
            include: {
                memberships: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
    });
});

describe("updateOrganization", () => {
    test("updates organization name if name is provided", async () => {
        const updatedOrg = { id: "org-123", name: "New Organization Name", slug: "new-organization-name" };
        prismaMock.organization.update.mockResolvedValue(updatedOrg as any);

        const result = await updateOrganization("org-123", { name: "New Organization Name" });

        expect(result).toEqual(updatedOrg);
        expect(prismaMock.organization.update).toHaveBeenCalledWith({
            where: { id: "org-123" },
            data: {
                name: "New Organization Name",
            },
        });
    });

    test("updates organization without regenerating slug if name is not provided", async () => {
        const updatedOrg = { id: "org-123", name: "New Organization", slug: "new-organization" };
        prismaMock.organization.update.mockResolvedValue(updatedOrg as any);

        const result = await updateOrganization("org-123", {});

        expect(result).toEqual(updatedOrg);
        expect(prismaMock.organization.update).toHaveBeenCalledWith({
            where: { id: "org-123" },
            data: {},
        });
    });
});

describe("inviteMember", () => {
    test("throws USER_NOT_FOUND if no user exists with the provided email", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        await expect(inviteMember("org-123", { email: "missing@example.com", role: "ADMIN" }))
            .rejects.toThrow("USER_NOT_FOUND");

        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            where: { email: "missing@example.com" },
        });
    });

    test("throws MEMBER_ALREADY_EXISTS if user is already a member of the organization", async () => {
        const fakeUser = { id: "u1", email: "existing@example.com" };
        const fakeMembership = { id: "m1", userId: "u1", organizationId: "o1", role: "MEMBER" };

        prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);
        prismaMock.orgMembership.findFirst.mockResolvedValue(fakeMembership as any);

        await expect(inviteMember("o1", { email: "existing@example.com", role: "ADMIN" }))
            .rejects.toThrow("MEMBER_ALREADY_EXISTS");

        expect(prismaMock.orgMembership.findFirst).toHaveBeenCalledWith({
            where: {
                userId: "u1",
                organizationId: "o1",
            },
        });
    });

    test("creates and returns a new membership on successful invitation", async () => {
        const fakeUser = { id: "u2", email: "newmember@example.com" };
        const createdMembership = {
            id: "m2",
            organizationId: "o1",
            userId: "u2",
            role: "ADMIN",
        };

        prismaMock.user.findUnique.mockResolvedValue(fakeUser as any);
        prismaMock.orgMembership.findFirst.mockResolvedValue(null);
        prismaMock.orgMembership.create.mockResolvedValue(createdMembership as any);

        const result = await inviteMember("o1", {
            email: "newmember@example.com",
            role: "ADMIN",
        });

        expect(result).toEqual(createdMembership);
        expect(prismaMock.orgMembership.create).toHaveBeenCalledWith({
            data: {
                organizationId: "o1",
                userId: "u2",
                role: "ADMIN",
            },
        });
    });
});