import { Request, Response, NextFunction } from "express";

interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  role?: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user || !req.user.role) {
        res.status(403).json({ error: 'Forbidden: No role assigned' });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
        return;
      }

      next();
    } catch (err) {
      console.error('Role check error:', err);
      res.status(500).json({ error: 'Internal server error during role check' });
    }
  };
}
