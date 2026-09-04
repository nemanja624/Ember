import express, { type Express } from "express";
import { authRouter } from "./auth/auth.routes.js";
import { errorHandler } from "./shared/errorHandler.js";
import cookieParser from "cookie-parser";
import "dotenv/config";

export const app: Express = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth/", authRouter);
app.use(errorHandler);
