/**
 * Shared request guards for the Developing Agent API routes.
 *
 * Both routes proxy to a paid LLM, so they share one rate-limit budget and the
 * same body-reading, access-gate, and error helpers.
 */
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Sliding-window limiter on LLM calls, keyed by client IP. The in-memory path
 * is per-server-instance (on a multi-instance deployment each instance gets its
 * own budget) — good enough to stop casual abuse of an open endpoint that
 * spends real API credits. When UPSTASH_REDIS_REST_URL/_TOKEN are set,
 * isRateLimited transparently switches to a shared Upstash store so the budget
 * holds across every instance.
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

/**
 * True when the request should be rejected with a 429. Uses the shared Upstash
 * store when configured (budget holds across instances), otherwise the
 * in-memory limiter. Async because the Upstash calls are network round-trips.
 */
export async function isRateLimited(key: string): Promise<boolean> {
  const upstash = await getUpstashLimiters();
  if (upstash) {
    // Global budget first so a single hot IP can't exhaust it on its own path.
    const globalResult = await upstash.global.limit("all");
    if (!globalResult.success) {
      return true;
    }
    const ipResult = await upstash.perIp.limit(key);
    return !ipResult.success;
  }

  return isRateLimitedInMemory(key);
}

function isRateLimitedInMemory(key: string): boolean {
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

interface UpstashLimiter {
  limit: (key: string) => Promise<{ success: boolean }>;
}

let upstashLimitersPromise: Promise<{ perIp: UpstashLimiter; global: UpstashLimiter } | null> | null =
  null;

/**
 * Builds the per-IP and global Upstash limiters once, when the REST env vars
 * are present. Returns null (so callers fall back to the in-memory limiter)
 * when Upstash is not configured or its packages fail to load.
 */
async function getUpstashLimiters(): Promise<
  { perIp: UpstashLimiter; global: UpstashLimiter } | null
> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!upstashLimitersPromise) {
    upstashLimitersPromise = (async () => {
      try {
        const [{ Ratelimit }, { Redis }] = await Promise.all([
          import("@upstash/ratelimit"),
          import("@upstash/redis"),
        ]);
        const redis = Redis.fromEnv();
        return {
          perIp: new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_REQUESTS, "60 s"),
            prefix: "llm:ip",
          }),
          global: new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(GLOBAL_RATE_LIMIT_MAX_REQUESTS, "60 s"),
            prefix: "llm:global",
          }),
        };
      } catch {
        // Package missing or misconfigured — degrade to the in-memory limiter.
        return null;
      }
    })();
  }

  return upstashLimitersPromise;
}

/**
 * Optional shared-secret gate for the paid LLM path. When PORTAL_ACCESS_CODE is
 * set, every live request must send a matching `x-portal-access-code` header;
 * when it is unset the gate is disabled so the open demo keeps working. Returns
 * a 401 Response to short-circuit on failure, or null to allow the request.
 */
export function accessCodeGate(req: Request): Response | null {
  const expected = process.env.PORTAL_ACCESS_CODE;
  if (!expected) {
    return null; // Gate disabled — behaves exactly like the open demo.
  }

  const provided = req.headers.get("x-portal-access-code") ?? "";
  if (!safeEqual(provided, expected)) {
    return jsonError(401, "Invalid or missing access code.");
  }
  return null;
}

/**
 * Constant-time string comparison. Hashing both sides to a fixed 32-byte digest
 * first means timingSafeEqual never throws on length mismatch and the compare
 * leaks neither the code nor its length.
 */
function safeEqual(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
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
