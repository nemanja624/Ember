import type { Request, Response, NextFunction } from "express";
import * as organizationService from "./org.service.js";
import * as memberService from "../member/member.service.js";

export async function myOrganization(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId, organizationId } = req.user;

        const organization = await organizationService.getMyOrganization(userId, organizationId);

        res.status(200).json(organization);
    }
    catch(err) {
        next(err);
    }
}

export async function organizationById(req: Request, res: Response, next: NextFunction) {
    try {
        const org = await organizationService.getOrganizationById(req.user!.organizationId);
        res.json(org);
    }
    catch(err) {
        next(err);
    }
}

export async function updateOrganization(req: Request, res: Response, next: NextFunction) {
    try {
        const updated = await organizationService.updateOrganization(req.user!.organizationId, req.body);
        res.json(updated);
    }
    catch(err) {
        next(err);
    }
}

export async function inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
        const membership = await memberService.inviteMember(req.user!.organizationId, req.body);
        res.status(201).json(membership);
    }
    catch(err) {
        next(err);
    }
}


