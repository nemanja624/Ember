import { z } from "zod";

export const inviteMemberSchema = z.object({
    email: z.string().email("Invalid email format"),
    role: z.enum(["ADMIN", "MEMBER"], {
        message: "Role must be ADMIN or MEMBER",
    }),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;