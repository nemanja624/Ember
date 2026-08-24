import "dotenv/config";
import express from "express";
import { authRouter } from "./auth/auth.routes.js";
import cookieParser from "cookie-parser";

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth/", authRouter);

app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});