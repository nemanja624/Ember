import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { login, getUserInfo, register, refresh, logout } from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";

export const authRouter: ExpressRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authMiddleware, getUserInfo);
authRouter.post("/refresh", refresh);
authRouter.post("/loguot", logout);