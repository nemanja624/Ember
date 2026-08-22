import type { Request, Response } from "express";
import { registerUser } from "./auth.service.js";
import { registerSchema } from "./auth.schema.js";

export async function register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);

    if(!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues });
    }

    try {
        const user = await registerUser(parsed.data.email, parsed.data.password, parsed.data.name);
        res.status(201).json({ id: user.id, email: user.email });
    } 
    catch(err) {
        console.log(err);
        if(err instanceof Error && err.message == "USER_ALREADY_EXISTS") {
            return res.status(409).json({ error: "User with this email already exists" });
        }

        res.status(500).json({ error: "Unexpected error" });
    }
}