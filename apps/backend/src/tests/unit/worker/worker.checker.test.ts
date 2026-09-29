import { describe, it, expect, vi, beforeEach } from "vitest";
import { pingMonitor } from "../../../worker/worker.checker.js";

describe("pingMonitor", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns status UP when target returns an expected status code", async () => {
    const mockResponse = {
      status: 200,
      body: { cancel: vi.fn() },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await pingMonitor("https://example.com", 200, 5000);

    expect(result.status).toBe("UP");
    expect(result.statusCode).toBe(200);
    expect(result.errorMessage).toBeNull();
    expect(mockResponse.body.cancel).toHaveBeenCalled();
  });

  it("returns status DOWN when target returns an unexpected status code", async () => {
    const mockResponse = {
      status: 500,
      body: { cancel: vi.fn() },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await pingMonitor("https://example.com", 200, 5000);

    expect(result.status).toBe("DOWN");
    expect(result.statusCode).toBe(500);
    expect(result.errorMessage).toContain("Expected status 200, but got 500");
  });

  it("returns status DOWN and timeout message when AbortError happens", async () => {
    const timeoutError = new Error("The operation was aborted");
    timeoutError.name = "TimeoutError";

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

    const result = await pingMonitor("https://example.com", 200, 1000);

    expect(result.status).toBe("DOWN");
    expect(result.statusCode).toBeNull();
    expect(result.errorMessage).toBe("The operation was aborted");
  });
});