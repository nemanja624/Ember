import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

type TokenPayload = {
    userId: string,
    organizationId: string;
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


