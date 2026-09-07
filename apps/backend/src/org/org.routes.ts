import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { userOrganizations, organizationById, updateOrganization, inviteMember, createOrganization } from "./org.controller.js";
import { validate } from "../shared/validate.middleware.js";
import { createOrgSchema, inviteMemberSchema, updateOrgSchema } from "./org.schema.js";
import { requireOrgRole } from "../auth/auth.requireOrgRole.js";

export const orgRouter: ExpressRouter = Router();

orgRouter.use(authMiddleware);

orgRouter.get("/me", userOrganizations);
orgRouter.get("/:id", requireOrgRole("OWNER", "ADMIN", "MEMBER"), organizationById);
orgRouter.post("/", validate(createOrgSchema), createOrganization);
orgRouter.patch("/:id", requireOrgRole("OWNER", "ADMIN"), validate(updateOrgSchema), updateOrganization);
orgRouter.post("/:id/members", requireOrgRole("OWNER", "ADMIN"), validate(inviteMemberSchema), inviteMember);
