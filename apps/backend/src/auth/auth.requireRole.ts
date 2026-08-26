import { Request, Response, NextFunction } from "express";
import { getUserRoleFromDb } from "./auth.service.js";

export function requireRole(...allowedRoles: string[]) {
  return async(req: Request, res: Response, next: NextFunction) => {
    try {
      if(!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const role = await getUserRoleFromDb(req.user.userId, req.user.organizationId);

      if(!role) {
        return res.status(403).json({ error: "User is not a member of this organization" });
      }

      if(!allowedRoles.includes(role)) {
        return res.status(401).json({ error: "Insufficient privileges" });
      }

      next();
    }
    catch(error) {
      console.error("Role check error: ", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

