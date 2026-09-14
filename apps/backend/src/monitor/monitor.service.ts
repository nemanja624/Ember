import { prisma } from "../shared/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import type { CreateMonitorInput, UpdateMonitorInput } from "./monitor.schema.js";

export async function createMonitor(organizationId: string, input: CreateMonitorInput) {
    return await prisma.monitor.create({
        data: {
            ...input,
            organizationId
        },
    });
}

export async function getMonitors(organizationId: string) {
    return await prisma.monitor.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
    });
}

export async function getMonitorById(organizationId: string, monitorId: string) {
    const monitor = await prisma.monitor.findFirst({
        where: {
            id: monitorId,
            organizationId,
        },
    });

    if(!monitor) {
        throw new Error("MONITOR_NOT_FOUND");
    }

    return monitor;
}

export async function updateMonitor(organizationId: string, monitorId: string, input: UpdateMonitorInput) {
    const existingMonitor = await prisma.monitor.findFirst({
        where: { id: monitorId, organizationId },
    });

    if(!existingMonitor) {
        throw new Error("MONITOR_NOT_FOUND");
    }

    const cleanData = Object.fromEntries(
        Object.entries(input).filter(([__dirname, value]) => value !== undefined)
    ) as Prisma.MonitorUpdateInput;

    return await prisma.monitor.update({
        where: { id: monitorId },
        data: cleanData,
    });
}

export async function deleteMonitor(organizationId: string, monitorId: string) {
    const existingMonitor = await prisma.monitor.findFirst({
        where: { id: monitorId, organizationId },
    });

    if(!existingMonitor) {
        throw new Error("MONITOR_NOT_FOUND");
    }

    await prisma.monitor.delete({
        where: { id: monitorId },
    });
    
    return { message: "Monitor deleted successfully" };
}

