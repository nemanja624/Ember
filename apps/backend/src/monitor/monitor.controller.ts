import type { Request, Response, NextFunction } from "express";
import { createMonitorSchema, updateMonitorSchema } from "./monitor.schema.js";
import * as monitorService from "./monitor.service.js"; 

export async function createMonitor(req: Request, res: Response, next: NextFunction) {
    try { 
        const { organizationId } = req.params;

        if(typeof organizationId !== "string") {
            throw new Error("ORGANIZATION_ID_REQUIRED");
        }

        const input = createMonitorSchema.parse(req.body);
        const monitor = await monitorService.createMonitor(organizationId, input);

        res.status(201).json({ data: monitor });
    }
    catch(err) {
        next(err);
    }
}

export async function getMonitors(req: Request, res: Response, next: NextFunction) {
    try {
        const { organizationId } = req.params;

        if(typeof organizationId !== "string") {
            throw new Error("ORGANIZATION_ID_REQUIRED");
        }

        const monitors = await monitorService.getMonitors(organizationId);

        res.json({ data: monitors });
    }
    catch(err) {
        next(err);
    }
}

export async function getMonitorById(req: Request, res: Response, next: NextFunction) {
    try {
        const { organizationId, monitorId } = req.params;

        if(typeof organizationId !== "string" || typeof monitorId !== "string") {
            throw new Error("INVALID_PARAMETERS");
        }

        const monitor = await monitorService.getMonitorById(organizationId, monitorId);

        res.json({ data: monitor });
    }
    catch(err) {
        next(err);
    }
}

export async function updateMonitor(req: Request, res: Response, next: NextFunction) {
    try {
        const { organizationId, monitorId } = req.params;

        if(typeof organizationId !== "string" || typeof monitorId !== "string") {
            throw new Error("INVALID_PARAMETERS");
        }

        const input = updateMonitorSchema.parse(req.body);
        const monitor = await monitorService.updateMonitor(organizationId, monitorId, input);

        res.json({ data: monitor });
    }
    catch(err) {
        next(err);
    }
}

export async function deleteMonitor(req: Request, res: Response, next: NextFunction) {
    try {
        const { organizationId, monitorId } = req.params;

        if(typeof organizationId !== "string" || typeof monitorId !== "string") {
            throw new Error("INVALID_PARAMETERS");
        }

        const result = await monitorService.deleteMonitor(organizationId, monitorId);

        res.json({ data: result });
    }
    catch(err) {
        next(err);
    }
}