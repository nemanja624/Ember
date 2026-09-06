import { prisma } from "../shared/prisma.js";
import type { InviteMemberInput } from "../org/org.schema.js";

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