import type { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service.js";

export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password, name, organizationName } = req.body; 

        const result = await authService.registerUser(email, password, name, organizationName);

        return res.status(201).json({
            data: {
                id: result.user.id,
                email: result.user.email,
            },
        });
    } 
    catch(err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;

        const { accessToken, refreshToken } = await authService.loginUser(email, password);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return res.status(200).json({ data: { accessToken } });
    }
    catch(err) {
        next(err);
    }
}

export async function getUserInfo(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await authService.getUserById(req.user!.userId);

        return res.status(200).json({ 
            data: {
                id: user.id,
                name: user.name,
            },
        });
    }
    catch(err) {
        next(err);
    }
}

export function refresh(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.refreshToken;

        if(!token) {
            throw new Error("REFRESH_TOKEN_INVALID");
        }

        const { accessToken, refreshToken } = authService.refreshTokens(token);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        res.status(200).json({ data: accessToken });
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
        data: {
            message: "Logged out successfully",
        },
    });
}