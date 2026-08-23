import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;

type AccessTokenPayload = {
    userId: string;
    organizationId: string;
};

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
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
        
        if(typeof decoded === "string") {
            return res.status(401).json({ msg: "Unauthorized" });
        }

        const payload = decoded as AccessTokenPayload;

        req.user = {
            userId: payload.userId,
            organizationId: payload.organizationId,
        };

        next();
    }
    
    catch(err) {
        return res.status(401).json({ msg: "Unauthorized" });
    }
}