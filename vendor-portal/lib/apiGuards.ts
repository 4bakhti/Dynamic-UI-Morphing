/**
 * Shared request guards for the Developing Agent API routes.
 *
 * Both routes proxy to a paid LLM, so they share one rate-limit budget and the
 * same body-reading and error helpers.
 */

/**
 * Sliding-window limiter on LLM calls, keyed by client IP. In-memory, so it is
 * per-server-instance (a determined attacker on a multi-instance deployment
 * gets N× the budget) — good enough to stop casual abuse of an open endpoint
 * that spends real API credits. Swap for a shared store (e.g. Upstash) if this
 * ever runs beyond a demo.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 6;
/**
 * Backstop across ALL clients combined. The per-IP key comes from
 * x-forwarded-for, which anyone who can reach the origin directly (any
 * deployment not fronted by a trusted proxy) can rotate per request to mint a
 * fresh per-IP budget. A global budget bounds total LLM spend — and the size
 * of requestLog — no matter how many IPs the traffic claims to come from.
 */
const GLOBAL_RATE_LIMIT_MAX_REQUESTS = 30;
const globalLog: number[] = [];
const requestLog = new Map<string, number[]>();

/**
 * Uses the leftmost x-forwarded-for entry, which is the real client IP on
 * platforms that overwrite the header (e.g. Vercel) but is client-controlled
 * when the origin is reachable directly — the global budget in isRateLimited
 * is what actually bounds spend in that case.
 */
export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;

  // Global budget first: while it is exhausted nothing below records state,
  // so rotating spoofed IPs can neither bypass the limit nor grow the map.
  while (globalLog.length > 0 && globalLog[0] <= cutoff) {
    globalLog.shift();
  }
  if (globalLog.length >= GLOBAL_RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Keep the map from growing unbounded under many distinct IPs.
  if (requestLog.size > 1_000) {
    requestLog.forEach((timestamps, ip) => {
      if (!timestamps.some((t) => t > cutoff)) {
        requestLog.delete(ip);
      }
    });
  }

  const recent = (requestLog.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(key, recent);
    return true;
  }

  recent.push(now);
  requestLog.set(key, recent);
  globalLog.push(now);
  return false;
}

export function readString(body: unknown, key: string): string | undefined {
  if (body && typeof body === "object" && key in body) {
    const value = (body as Record<string, unknown>)[key];
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

export function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Streams a pre-verified string in small chunks so a DEMO_MODE response still
 * animates like a live generation while remaining 100% deterministic.
 */
export function streamCannedText(source: string): Response {
  const encoder = new TextEncoder();
  const chunkSize = 4;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (let i = 0; i < source.length; i += chunkSize) {
        controller.enqueue(encoder.encode(source.slice(i, i + chunkSize)));
        // Pacing so the "typing" animation reads well during the demo.
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
