import "dotenv/config";
import express from "express";
import { authRouter } from "./auth/auth.routes.js";

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use("/api/auth/", authRouter);

app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});