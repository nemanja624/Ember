import { prisma } from "../shared/prisma.js";
import { pingMonitor } from "./worker.checker.js";

export async function runHealthcheckCycle() {
    const now = new Date();

    const activeMonitors = await prisma.monitor.findMany({
        where: {
            isActive: true,
        },
    }); 

    const monitorsToProcess = activeMonitors.filter((monitor) => {
        if(!monitor.lastCheckedAt) {
            return true;
        }

        const nextCheckDue = new Date(
            monitor.lastCheckedAt.getTime() + monitor.intervalSeconds * 1000
        );

        return now >= nextCheckDue;
    });

    const checkPromises = monitorsToProcess.map(async (monitor) => {
        const result = await pingMonitor(
            monitor.target,
            monitor.expectedStatus,
            monitor.timeoutMs,
        );

        await prisma.$transaction([
            prisma.monitorCheck.create({
                data: {
                    monitorId: monitor.id,
                    statusCode: result.statusCode,
                    responseTimeMs: result.responseTimeMs,
                    status: result.status,
                    errorMessage: result.errorMessage,
                },
            }),

            prisma.monitor.update({
                where: { id: monitor.id },
                data: {
                    status: result.status,
                    lastCheckedAt: now,
                },
            }),
        ]);
    });


    await Promise.allSettled(checkPromises);
}