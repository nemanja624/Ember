import jwt from "jsonwebtoken";
import type { OrgRole } from "@prisma/client";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

// fail-early pattern
if(!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must both be set in .env");
} 

export type TokenPayload = {
    userId: string,
    organizationId: string;
    role: OrgRole;
};

export function signAccessToken(payload: TokenPayload) {
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
        expiresIn: "15m",
    });
}

export function signRefreshToken(payload: TokenPayload) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: "7d",
    });
}

export function verifyAccessToken(token: string) {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    if(typeof decoded === "string") {
        throw new Error("Invalid token payload");
    }

    return decoded as TokenPayload;
}

export function verifyRefreshToken(token: string) {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);

    if(typeof decoded === "string") {
        throw new Error("Invalid token payload");
    }

    return decoded as TokenPayload;
}


