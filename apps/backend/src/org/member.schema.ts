import { z } from "zod";

const roleEnum = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"], {
    message: "Role is required and must be OWNER, ADMIN, MEMBER or VIEWER",
});

export const inviteMemberSchema = z.object({
    email: z.string().email("Invalid email address"),
    role: roleEnum,
});

export const updateRoleSchema = z.object({
    role: roleEnum,
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;