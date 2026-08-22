import type { Request, Response } from "express";
import { registerUser } from "./auth.service.js";

export async function register(req: Request, res: Response) {
    const { email, password, name } = req.body;

    try {
        const user = await registerUser(email, password, name);
        res.status(201).json({ id: user.id, email: user.email });
    } 
    catch(err) {
        if(err instanceof Error && err.message == "USER_ALREADY_EXISTS") {
            return res.status(409).json({ error: "User with this email already exists" });
        }

        res.status(500).json({ error: "Unexpected error" });
    }
}