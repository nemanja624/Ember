import type { Request, Response, NextFunction } from "express";
import * as memberService from "./member.service.js";
import { inviteMemberSchema, updateRoleSchema } from "./member.schema.js";

export async function addMember(req: Request, res: Response, next: NextFunction) {
    try {
        const organizationId = req.params.id as string;
        const input = inviteMemberSchema.parse(req.body);

        const membership = await memberService.addMember(organizationId, input);

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
        const { role } = updateRoleSchema.parse(req.body);

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

        const result = await memberService.removeMember(organizationId, userId);

        return res.status(200).json({ data: result });
    }
    catch(err) {
        next(err);
    }
}