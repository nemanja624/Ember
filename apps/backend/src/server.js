import express from "express";
import { authRouter } from "./auth/auth.routes.js";

const app = express();

const port = process.env.PORT;

app.use("/auth", authRouter);

app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});