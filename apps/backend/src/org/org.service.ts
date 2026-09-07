import { prisma } from "../shared/prisma.js";
import type { UpdateOrgInput } from "./org.schema.js";

export async function getMyOrganization(userId: string, organizationId: string) {
    const membership = await prisma.orgMembership.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId,
            },
        },
        include: {
            organization: true,
        },
    });

    if(!membership) {
        throw new Error("USER_HAS_NO_ORGANIZATION");
    }

    return membership.organization;
}

export async function getUserOrganizations(userId: string) {
    const memberships = await prisma.orgMembership.findMany({
        where: { userId },
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    createdAt: true,
                },
            },
        },
        orderBy: {
            organization: { createdAt: "desc" },
        },
    });

    return memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
        createdAt: m.organization.createdAt,
    }));
}

export async function getOrganizationById(orgId: string) {
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            memberships: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
        },
    });

    if(!org) {
        throw new Error("ORGANIZATION_NOT_FOUND"); // added to error-handler
    }

    return org;
}

export async function createOrganization(userId: string, name: string) {
    const slug = generateSlug(name);

    const organization = await prisma.organization.create({
        data: {
            name,
            slug,
            memberships: {
                create: {
                    userId,
                    role: "OWNER",
                    
                },
            },
        },
        include: {
            memberships: {
                where: { userId },
                select: { role: true },
            },
        },
    });

    return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: organization.memberships[0]?.role || "OWNER",
        createdAt: organization.createdAt,
    };
}

export async function updateOrganization(orgId: string, data: UpdateOrgInput) {
    const updateData: Record<string, any> = {};

    if(data.name !== undefined) {
        updateData.name = data.name;
    }

    return await prisma.organization.update({
        where: { id: orgId },
        data: updateData,
    });
}

const generateSlug = (name: string): string => {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${randomSuffix}`;
};