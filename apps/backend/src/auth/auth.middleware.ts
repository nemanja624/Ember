import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../shared/jwt.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ msg: "Unauthorized" });
    }
    
    const token = authHeader.split(" ")[1]

    if(!token) {
        return res.status(401).json({ msg: "Unauthorized" });
    }

    try {    
        const payload = verifyAccessToken(token);

        req.user = {
            userId: payload.userId,
            organizationId: payload.organizationId,
            role: payload.role,
        };

        next();
    }
    
    catch(err) {
        console.error("JWT verification failed", err);
        return res.status(401).json({ msg: "Unauthorized" });
    }
}
