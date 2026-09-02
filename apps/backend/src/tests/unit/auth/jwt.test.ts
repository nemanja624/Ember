import { expect, test, vi } from "vitest";
import jwt from "jsonwebtoken";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../../../shared/jwt.js";

const payload = {
    userId: "user-123",
    organizationId: "org-123",
    role: "OWNER" as const
};

test("properly signs access token", () => {
    const token = signAccessToken(payload);

    expect(token).toBeTypeOf("string");
    expect(token.split(".")).toHaveLength(3);
});

test("properly signs refresh token", () => {
    const token = signRefreshToken(payload);

    expect(token).toBeTypeOf("string");
    expect(token.split(".")).toHaveLength(3);
});

test("properly verifies access token", () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.organizationId).toBe(payload.organizationId);
    expect(decoded.role).toBe(payload.role);
});

test("properly verifies refresh token", () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.organizationId).toBe(payload.organizationId);
    expect(decoded.role).toBe(payload.role);
});

test("rejects access token signed with wrong secret", () => {
    const refreshToken = signRefreshToken(payload);

    expect(() => verifyAccessToken(refreshToken)).toThrow();
});

test("rejects a token whose payload is a plain string", () => {
    const weirdToken = jwt.sign("just-a-string", process.env["JWT_ACCESS_SECRET"]!);

    expect(() => verifyAccessToken(weirdToken)).toThrow();
});

test("rejects an expired access token", () => {
    const token = signAccessToken(payload);

    vi.useFakeTimers();
    vi.advanceTimersByTime(16 * 60 * 1000);

    expect(() => verifyAccessToken(token)).toThrow();

    vi.useRealTimers();
});