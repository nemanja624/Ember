import { z } from "zod";

export const createMonitorSchema = z.object({
    name: z
        .string({ message: "Name is required" })
        .min(1, "Name cannot be empty")
        .max(100, "Name is too long"),
    type: z.enum(["HTTP", "HTTPS"], {
        message: "Type must be either HTTP or HTTPS",
    }),
    target: z
        .string({ message: "Target URL is required" })
        .url("Target must be a valid URL (https://example.com)"),
        intervalSeconds: z
            .number()
            .int("Interval must be an integer")
            .min(10, "Minimum interval is 10 seconds")
            .max(86400, "Maximum interval is 24 hours")
            .default(60),
        timeoutMs: z
            .number()
            .int("Timeout must be an integer")
            .min(1000, "Minimum timeout is 1000ms")
            .max(30000, "Maximum timeout is 30000ms")
            .default(5000),
        expectedStatus: z
            .number()
            .int("Expected status must be an integer")
            .min(100, "Invalid HTTP status code")
            .max(599, "Invalid HTTP status code")
            .default(200),
});

export const updateMonitorSchema = createMonitorSchema.partial();

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;