import type { Request, Response } from "express";
import { loginUser, registerUser } from "./auth.service.js";
import { registerSchema } from "./auth.schema.js";

export async function register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);

    if(!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
    }

    try {
        const result = await registerUser(parsed.data.email, parsed.data.password, parsed.data.name, parsed.data.organizationName);
        res.status(201).json({
            id: result.user.id, 
            email: result.user.email,
        });
    } 
    catch(err) {
        console.log(err);
        if(err instanceof Error && err.message == "USER_ALREADY_EXISTS") {
            return res.status(409).json({ error: "User with this email already exists" });
        }

        res.status(500).json({ error: "Unexpected error" });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        if(!email || !password) {
            throw new Error("MISSING_CREDENTIALS");
        }

        const { accessToken, refreshToken } = await loginUser(email, password);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return res.status(200).json({ accessToken });    
    } 
    catch(err) {
        if(err instanceof Error && err.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        return res.status(500).json({
            error: "Unexpected error",
        });
    }
}