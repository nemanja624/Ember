import bcrypt from "bcrypt";
import { prisma } from "../shared/prisma.js";
import { signAccessToken, signRefreshToken } from "../shared/jwt.js";

export async function registerUser(email: string, password: string, name: string, organizationName: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if(existingUser) {
        throw new Error("USER_ALREADY_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const slug = organizationName.toLowerCase().trim().replace(/\s+/g, "-");

    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email,
                passwordHash,
                name,
            },
        });

        const organization = await tx.organization.create({
            data: {
                name: organizationName,
                slug,
            },
        });

        await tx.orgMembership.create({
            data: {
                organizationId: organization.id,
                userId: user.id,
                role: "OWNER",
            },
        });

        return { user, organization };
    })

    return result;
}

export async function loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            memberships: true,
        },
    });

    if(!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if(!isMatch) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const membership = user.memberships[0];

    if(!membership) {
        throw new Error("USER_HAS_NO_ORGANIZATION");
    }

    const payload = {
        userId: user.id,
        organizationId: membership.organizationId,
    };

    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload);

    return { accessToken, refreshToken };
}

 