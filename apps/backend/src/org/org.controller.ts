import type { Request, Response, NextFunction } from "express";
import * as organizationService from "./org.service.js";
import * as memberService from "./member.service.js";

export async function userOrganizations(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.userId;

        const organizations = await organizationService.getUserOrganizations(userId);

        return res.status(200).json({ data: organizations });
    }
    catch(err) {
        next(err);
    }
}

export async function organizationById(req: Request, res: Response, next: NextFunction) {
    try {
        const organizationId = req.params.id as string;

        if(!organizationId) {
            throw new Error("ORGANIZATION_ID_REQUIRED")
        }

        const org = await organizationService.getOrganizationById(organizationId);

        return res.status(200).json({ data: org });
    }
    catch(err) {
        next(err);
    }
}

export async function createOrganization(req: Request, res: Response, next: NextFunction) {
    try {
        const { name } = req.body;
        const userId = req.user!.userId;

        const organization = await organizationService.createOrganization(userId, name);

        return res.status(201).json({ data: organization });
    }
    catch(err) {
        next(err);
    }
}

export async function updateOrganization(req: Request, res: Response, next: NextFunction) {
    try {
        const organizationId = req.params.id as string;

        if(!organizationId) {
            throw new Error("ORGANIZATION_ID_REQUIRED");
        }

        const updated = await organizationService.updateOrganization(organizationId, req.body);

        return res.status(200).json({ data: updated });
    }
    catch(err) {
        next(err);
    }
}

export async function inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
        const organizationId = req.params.id as string;

        if(!organizationId) {
            throw new Error("ORGANIZATION_ID_REQUIRED");
        }

        const membership = await memberService.inviteMember(organizationId, req.body);
        
        return res.status(201).json({ data: membership });
    }
    catch(err) {
        next(err);
    }
}


