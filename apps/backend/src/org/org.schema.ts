import { z } from "zod";

export const updateOrgSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export const inviteMemberSchema = z.object({
    email: z.string().email("Invalid email format"),
    role: z.enum(["ADMIN", "MEMBER"], {
        message: "Role must be ADMIN or MEMBER",
    }),
});

export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;