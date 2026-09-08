import { prisma } from "../shared/prisma.js";
import type { InviteMemberInput } from "./member.schema.js";

export async function inviteMember(orgId: string, input: InviteMemberInput) {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if(!user) {
        throw new Error("USER_NOT_FOUND");
    }

    const existingMembership = await prisma.orgMembership.findFirst({
        where: {
            userId: user.id,
            organizationId: orgId,
        },
    });

    if(existingMembership) {
        throw new Error("MEMBER_ALREADY_EXISTS"); 
    }

    return await prisma.orgMembership.create({
        data: {
            organizationId: orgId,
            userId: user.id,
            role: input.role,
        },
    });
}

export async function updateMemberRole(organizationId: string, userId: string, newRole: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER") {
    const membership = await prisma.orgMembership.findUnique({
        where: {
            organizationId_userId: { organizationId, userId },
        },
    });

    if(!membership) {
        throw new Error("MEMBERSHIP_NOT_FOUND");
    }

    if(membership.role === "OWNER" && newRole !== "OWNER") {
        const ownerCount = await prisma.orgMembership.count({
            where: { 
                organizationId,
                role: "OWNER",
            },
        });

        if(ownerCount <= 1) {
            throw new Error("CANNOT_CHANGE_LAST_OWNER_ROLE");
        }
    }

    const updatedMembership = await prisma.orgMembership.update({
        where: {
            organizationId_userId: { organizationId, userId },
        },
        data: {
            role: newRole,
        },
    });

    return updatedMembership;
}

export async function removeMember(organizationId: string, userId: string) {
    const membership = await prisma.orgMembership.findUnique({
        where: {
            organizationId_userId: { organizationId, userId },
        },

    });

    if(!membership) {
        throw new Error("MEMBERSHIP_NOT_FOUND");
    }

    if(membership.role === "OWNER") {
        const ownerCount = await prisma.orgMembership.count({
            where: {
                organizationId,
                role: "OWNER",
            },
        });

        if(ownerCount <= 1) {
            throw new Error("CANNOT_REMOVE_LAST_OWNER");
        }
    }

    await prisma.orgMembership.delete({
        where: {
            organizationId_userId: { organizationId, userId },
        },
    });

    return { message: "Member removed successfully" };
}