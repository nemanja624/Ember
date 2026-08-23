import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { login, register } from "./auth.controller.js";

export const authRouter: ExpressRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);