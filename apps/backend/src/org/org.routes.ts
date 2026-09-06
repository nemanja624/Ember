import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { myOrganization, organizationById, updateOrganization, inviteMember } from "./org.controller.js";
import { requireRole } from "../auth/auth.requireRole.js";
import { validate } from "../shared/validate.middleware.js";
import { inviteMemberSchema, updateOrgSchema } from "./org.schema.js";

export const orgRouter: ExpressRouter = Router();

orgRouter.use(authMiddleware);

orgRouter.get("/me", myOrganization);
orgRouter.get("/:id", organizationById);
orgRouter.patch("/me", requireRole("OWNER", "ADMIN"), validate(updateOrgSchema), updateOrganization);
orgRouter.post("/members", requireRole("OWNER", "ADMIN"), validate(inviteMemberSchema), inviteMember);
