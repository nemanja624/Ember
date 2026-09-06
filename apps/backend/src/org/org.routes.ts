import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { myOrg } from "./org.controller.js";

export const orgRouter: ExpressRouter = Router();

orgRouter.get("/organizations/me", authMiddleware, myOrg);