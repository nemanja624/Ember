import type { Request, Response, NextFunction } from "express";
import { prisma } from "../shared/prisma.js";

export const requireOrgRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawOrgId = req.params.id || req.headers["x-organization-id"];

      const orgId = Array.isArray(rawOrgId) ? rawOrgId[0] : rawOrgId;

      if (!orgId) {
        return res.status(400).json({ error: "ORGANIZATION_ID_REQUIRED" });
      }

      if (!req.user?.userId) {
        return res.status(401).json({ error: "UNAUTHORIZED" });
      }

      const membership = await prisma.orgMembership.findFirst({
        where: {
          userId: req.user.userId,
          organizationId: orgId,
        },
      });

      if (!membership) {
        return res.status(403).json({ error: "NOT_A_MEMBER" });
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({ error: "INSUFFICIENT_PRIVILEGES" });
      }

      req.membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};