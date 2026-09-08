import type { Request, Response, NextFunction } from "express";

const ERROR_STATUS_MAP: Record<string, number> = {
  MISSING_CREDENTIALS: 400,
  INVALID_CREDENTIALS: 401,
  REFRESH_TOKEN_INVALID: 401,
  UNAUTHORIZED: 401,
  USER_HAS_NO_ORGANIZATION: 403,
  USER_NOT_FOUND: 404,
  ORGANIZATION_NOT_FOUND: 404,
  USER_ALREADY_EXISTS: 409,
  MEMBER_ALREADY_EXISTS: 409,
  NOT_A_MEMBER: 403,
  MEMBERSHIP_NOT_FOUND: 404,
  INSUFFICIENT_PRIVILEGES: 403,
  ORGANIZATION_ID_REQUIRED: 400,
  USER_ID_REQUIRED: 400,
  CANNOT_CHANGE_LAST_OWNER_ROLE: 400,
  CANNOT_REMOVE_LAST_OWNER: 400,
};

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof Error) {
    const statusCode = ERROR_STATUS_MAP[err.message];

    if (statusCode) {
      return res.status(statusCode).json({ error: err.message });
    }
  }

  console.error("Unhandled Error:", err);
  return res.status(500).json({ error: "Unexpected error" });
}