import { prisma } from "../shared/prisma.js";
import { pingMonitor } from "./worker.checker.js";
import { sendWebhookNotification } from "./notifier.service.js";

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

        const previousStatus = monitor.status;
        const newStatus = result.status;
        const isStatusChanged = previousStatus !== newStatus && previousStatus !== "UNKNOWN";

        await prisma.$transaction(async (tx) => {
            await tx.monitorCheck.create({
                data: {
                    monitorId: monitor.id,
                    statusCode: result.statusCode,
                    responseTimeMs: result.responseTimeMs,
                    status: newStatus,
                    errorMessage: result.errorMessage,
                },
            });

            await tx.monitor.update({
                where: { id: monitor.id },
                data: {
                    status: newStatus,
                    lastCheckedAt: now,
                },
            });

            if(isStatusChanged) {
                if(newStatus === "DOWN") {
                    await tx.incident.create({
                        data: {
                            monitorId: monitor.id,
                            cause: result.errorMessage,
                            startedAt: now,
                        },
                    });
                } else if(newStatus === "UP") {
                    const openIncident = await tx.incident.findFirst({
                        where: { mnitorId: monitor.id, resolvedAt: null },
                        orderBy: { startedAt: "desc" },
                    });

                    if(openIncident) {
                        await tx.incident.update({
                            where: { id: openIncident.id },
                            data: { resolvedAt: now },
                        });
                    }
                }
            }
        });

        if (isStatusChanged && monitor.webhookUrl) {
            sendWebhookNotification(monitor.webhookUrl, {
                monitorName: monitor.name,
                targetUrl: monitor.target,
                status: newStatus as "UP" | "DOWN",
                errorMessage: result.errorMessage,
                responseTimeMs: result.responseTimeMs,
            });
        }
    });

  await Promise.allSettled(checkPromises);
}