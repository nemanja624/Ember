import type { Request, Response, NextFunction } from "express";
import { getUserById, loginUser, refreshTokens, registerUser } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.schema.js";

export async function register(req: Request, res: Response, next: NextFunction) {
    const parsed = registerSchema.safeParse(req.body);

    if(!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues, details: parsed.error.issues });
    }

    try {
        const result = await registerUser(parsed.data.email, parsed.data.password, parsed.data.name, parsed.data.organizationName);
        res.status(201).json({
            id: result.user.id, 
            email: result.user.email,
        });
    } 
    catch(err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    const parsed = loginSchema.safeParse(req.body)

    if(!parsed.success) {
        return res.status(400).json({ error: "MISSING_CREDENTIALS", details: parsed.error.issues });
    }

    try {
        const { accessToken, refreshToken } = await loginUser(parsed.data.email, parsed.data.password);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return res.status(200).json({ accessToken });
    }
    catch(err) {
        next(err);
    }
}

export async function getUserInfo(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await getUserById(req.user.userId);

        return res.status(200).json({ 
            id: user.id,
            name: user.name,
            organizationId: req.user.organizationId,
        });
    }
    catch(err) {
        next(err);
    }
}

export function refresh(req: Request, res: Response, next: NextFunction) {
    
    console.log("RAW COOKIE: ", req.headers.cookie);
    console.log("PARSED COOKIES: ", req.cookies);

    const token = req.cookies?.refreshToken;

    if(!token) {
        return next(new Error("REFRESH_TOKEN_INVALID"));
    }

    try {
        const { accessToken, refreshToken } = refreshTokens(token);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        res.json({ accessToken });
    }
    catch(err) {
        next(err);
    }
}

export function logout(req: Request, res: Response) {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    return res.status(200).json({
        message: "Logged out successfully",
    });
}