import { z } from "zod";

export const updateOrgSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export const createOrgSchema = z.object({
    body: z.object({
        name: z
        .string({ message: "NAME_REQUIRED" })
        .min(2, "NAME_TOO_SHORT")
        .max(50, "NAME_TOO_LONG")
        .trim(),
    }),
});

export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type CreateOrgInput = z.infer<typeof createOrgSchema>["body"];
