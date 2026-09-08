import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { userOrganizations, organizationById, updateOrganization, createOrganization } from "./org.controller.js";
import { validate } from "../shared/validate.middleware.js";
import { createOrgSchema, updateOrgSchema } from "../org/org.schema.js";
import { inviteMemberSchema, updateRoleSchema } from "../org/member.schema.js";
import { requireOrgRole } from "../auth/auth.requireOrgRole.js";
import { inviteMember, updateMemberRole, removeMember } from "./member.controller.js";

export const orgRouter: ExpressRouter = Router();

orgRouter.use(authMiddleware);

orgRouter.get("/me", userOrganizations);

orgRouter.get("/:id", requireOrgRole("OWNER", "ADMIN", "MEMBER"), organizationById);

orgRouter.post("/", validate(createOrgSchema), createOrganization);

orgRouter.patch("/:id", requireOrgRole("OWNER", "ADMIN"), validate(updateOrgSchema), updateOrganization);

orgRouter.patch("/:id/members/:userId", requireOrgRole("OWNER", "ADMIN"), validate(updateRoleSchema), updateMemberRole);

orgRouter.post("/:id/members", requireOrgRole("OWNER", "ADMIN"), validate(inviteMemberSchema), inviteMember);

orgRouter.delete("/:id/members/:userId", requireOrgRole("OWNER", "ADMIN"), removeMember);

