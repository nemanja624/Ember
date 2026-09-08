import type { Request, Response, NextFunction } from "express";
import * as memberService from "./member.service.js";

export async function inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
        const organizationId = req.params.id as string;
        const membership = await memberService.inviteMember(organizationId, req.body);

        return res.status(201).json({ data: membership });
    }
    catch(err) {
        next(err);
    }
}