import { z } from "zod";

export const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    name: z.string().min(2).max(60),
});

export type RegisterInput = z.infer<typeof registerSchema>;