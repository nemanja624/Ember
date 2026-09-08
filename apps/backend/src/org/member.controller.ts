import type { Request, Response, NextFunction } from "express";
import * as memberService from "./member.service.js";

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

export async function updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
        const organizationId = req.params.id as string;
        const userId = req.params.userId as string;
        const { role } = req.body;

        if(!organizationId) {
            throw new Error("ORGANIZATION_ID_REQUIRED");
        }

        if(!userId) {
            throw new Error("USER_ID_REQUIRED");
        }

        const updatedMembership = await memberService.updateMemberRole(organizationId, userId, role);

        return res.status(200).json({ data: updatedMembership });
    }
    catch(err) {
        next(err);
    }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
    try {
        const organizationId = req.params.id as string;
        const userId = req.params.userId as string;

        if(!organizationId) {
            throw new Error("ORGANIZATION_ID_REQUIRED");
        }

        if(!userId) {
            throw new Error("USER_ID_REQUIRED");
        }

        const result = await memberService.removeMember(organizationId, userId);

        return res.status(200).json({ data: result });
    }
    catch(err) {
        next(err);
    }
}