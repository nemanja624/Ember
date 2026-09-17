import { prisma } from "../shared/prisma.js";
import { runHealthcheckCycle } from "./worker.healthcheck.service.js";

const TICK_INTERVAL_MS = 5000;
let isRunning = false;

async function tick() {
    if(isRunning) {
        console.warn("Last cycle is still running, skipping this tick...");
        return;
    }

    isRunning = true;

    try {
        await runHealthcheckCycle();
    }
    catch(err) {
        console.error("Critical error in healthcheck cycle:", err);
    }
    finally {
        isRunning = false;
    }
}

console.log("PulseCheck Worker started successfully...");

tick();
const intervalId = setInterval(tick, TICK_INTERVAL_MS);

async function shutdown(signal: string) {
    console.log(`\nShutdown signal received (${signal})...`);

    clearInterval(intervalId);

    try {
        await prisma.$disconnect();
        console.log("Prisma connection is closed. Process finished successfully.");
        process.exit(0);
    }
    catch(err) {
        console.error("Error trying to close the connection to database:", err);
        process.exit(1);
    }
}

// waiting for OS signals
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

