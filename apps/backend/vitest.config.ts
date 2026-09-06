import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
    test: {
        environment: "node",
        fileParallelism: false, // blocks more test files running at the same time
        coverage: {
            provider: "v8",
        },
    },
});