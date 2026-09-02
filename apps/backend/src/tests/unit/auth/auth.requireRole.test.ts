import { describe, expect, test, vi } from "vitest";
import type { Request, Response } from "express";
import { requireRole } from "../../../auth/auth.requireRole.js";

function createMockRes() {
    const res: Partial<Response> = {}; 
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
}

function createMockReq(user?: { userId: string; organizationId: string; role: string }): Request {
    return { user } as unknown as Request;
}

describe("requireRole", () => {
    test("returns 401 if req.user is missing", () => {
        const req = createMockReq(undefined);
        const res = createMockRes();
        const next = vi.fn();

        requireRole("ADMIN")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
        expect(next).not.toHaveBeenCalled();
    });

    test("returns 403 if user's role is not in allowedRoles", () => {
        const req = createMockReq({ userId: "u1", organizationId: "o1", role: "VIEWER" });
        const res = createMockRes();
        const next = vi.fn();

        requireRole("ADMIN", "OWNER")(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "Insufficient privileges" });
        expect(next).not.toHaveBeenCalled();
    });

    test("calls next() if user's role is in allowedRoles", () => {
        const req = createMockReq({ userId: "u1", organizationId: "o1", role: "OWNER" });
        const res = createMockRes();
        const next = vi.fn();

        requireRole("ADMIN", "OWNER")(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
    });

    test("allows access when one of multiple allowed roles matches", () => {
        const req = createMockReq({ userId: "u1", organizationId: "o1", role: "MEMBER" });
        const res = createMockRes();
        const next = vi.fn();

        requireRole("MEMBER", "ADMIN", "OWNER")(req, res, next);

        expect(next).toHaveBeenCalledOnce();
    });
});



