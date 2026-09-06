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