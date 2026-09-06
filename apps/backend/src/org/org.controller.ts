import type { Request, Response, NextFunction } from "express";
import { getMyOrganization as getMyOrg } from "./org.service.js";

export async function getMyOrganization(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId, organizationId } = req.user;

        const organization = await getMyOrg(userId, organizationId);

        res.status(200).json(organization);
    }
    catch(err) {
        next(err);
    }
}

