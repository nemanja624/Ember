import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { login, getUserInfo, register, refresh, logout } from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { validate } from "../shared/validate.middleware.js";

export const authRouter: ExpressRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.get("/me", authMiddleware, getUserInfo);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);