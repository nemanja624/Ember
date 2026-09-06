import type { Request, Response, NextFunction } from "express";
import { getMyOrganization, getOrganizationById, updateOrganization } from "./org.service.js";

export async function myOrg(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId, organizationId } = req.user;

        const organization = await getMyOrganization(userId, organizationId);

        res.status(200).json(organization);
    }
    catch(err) {
        next(err);
    }
}

export async function orgById(req: Request, res: Response, next: NextFunction) {
    try {
        const org = await getOrganizationById(req.user!.organizationId);
        res.json(org);
    }
    catch(err) {
        next(err);
    }
}

export async function updateOrg(req: Request, res: Response, next: NextFunction) {
    try {
        const updated = await updateOrganization(req.user!.organizationId, req.body);
        res.json(updated);
    }
    catch(err) {
        next(err);
    }
}


