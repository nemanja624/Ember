interface CheckResult {
    statusCode: number | null;
    responseTimeMs: number;
    status: "UP" | "DOWN";
    errorMessage: string | null;
}

export async function pingMonitor(targetUrl: string, expectedStatus: number, timeoutMs: number): Promise<CheckResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // network request is automatically aborted after timeoutMs 

    const startTime = performance.now();

    try {
        const response = await fetch(targetUrl, {
            method: "GET",
            signal: controller.signal,
            headers: {
                "User-Agent": "PulseCheck-UptimeBot/1.0",
            },
        });

        clearTimeout(timeoutId);
        
        const responseTimeMs = Math.round(performance.now() - startTime);
        const isSuccess = response.status === expectedStatus;

        await response.body?.cancel();

        return {
            statusCode: response.status,
            responseTimeMs,
            status: isSuccess ? "UP" : "DOWN",
            errorMessage: isSuccess ? null : `Expected status ${expectedStatus}, but got ${response.status}`
        };
    }
    catch(err: any) {
        clearTimeout(timeoutId);
        
        const responseTimeMs = Math.round(performance.now() - startTime);

        const isTimeout = err.name === "AbortError";
        const errorMessage = isTimeout ? `Request timed out after ${timeoutMs}ms` : err.message || "Network error";

        return {
            statusCode: null,
            responseTimeMs,
            status: "DOWN",
            errorMessage,
        };
    }
}