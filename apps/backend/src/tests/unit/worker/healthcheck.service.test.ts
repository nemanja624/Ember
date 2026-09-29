import { describe, it as test, expect, vi, beforeEach } from "vitest";

const { mockPingMonitor } = vi.hoisted(() => ({
  mockPingMonitor: vi.fn(),
}));

vi.mock("../../../worker/worker.checker.js", () => ({
  pingMonitor: mockPingMonitor,
}));

import { runHealthcheckCycle } from "../../../worker/worker.healthcheck.service.js"; 
import { prisma } from "../../../shared/prisma.js";

describe("runHealthcheckCycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("processes monitors and creates an incident", async () => {
    const mockMonitor = {
      id: "mon-1",
      name: "Test API",
      target: "https://api.test.com",
      expectedStatus: 200,
      timeoutMs: 3000,
      intervalSeconds: 60,
      isActive: true,
      status: "UP",
      lastCheckedAt: null,
      webhookUrl: null,
    };

    mockPingMonitor.mockResolvedValue({
      statusCode: 500,
      responseTimeMs: 120,
      status: "DOWN",
      errorMessage: "Expected status 200, but got 500",
    });

    vi.spyOn(prisma.monitor, "findMany").mockResolvedValue([mockMonitor as any]);
    vi.spyOn(prisma.monitorCheck, "create").mockResolvedValue({} as any);
    vi.spyOn(prisma.incident, "create").mockResolvedValue({} as any);
    vi.spyOn(prisma.incident, "findFirst").mockResolvedValue(null);
    vi.spyOn(prisma.monitor, "update").mockResolvedValue({} as any);

    vi.spyOn(prisma, "$transaction").mockImplementation(async (arg: any) => {
      if (typeof arg === "function") {
        return arg(prisma);
      }
      return arg;
    });

    await runHealthcheckCycle();

    expect(prisma.monitorCheck.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        monitorId: "mon-1",
        status: "DOWN",
        statusCode: 500,
      }),
    });

    expect(prisma.incident.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        monitorId: "mon-1",
        cause: "Expected status 200, but got 500",
      }),
    });
  });
});