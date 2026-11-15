/**
 * Shared request guards for the demo-app's sponsor API routes (Gemini,
 * ElevenLabs, Solana). Every one of them spends real credits or lamports, so
 * they share one in-memory per-IP + global budget, mirroring the vendor
 * portal's limiter. Per-instance only — good enough to stop casual abuse of a
 * public hackathon deployment.
 */

const WINDOW_MS = 60_000;
const PER_IP_MAX = 20;
const GLOBAL_MAX = 120;

const perIp = new Map<string, number[]>();
const globalLog: number[] = [];

export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function isRateLimited(req: Request, bucket: string): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  while (globalLog.length > 0 && globalLog[0] <= cutoff) globalLog.shift();
  if (globalLog.length >= GLOBAL_MAX) return true;

  if (perIp.size > 1_000) {
    perIp.forEach((stamps, key) => {
      if (!stamps.some((t) => t > cutoff)) perIp.delete(key);
    });
  }

  const key = `${bucket}:${clientKey(req)}`;
  const recent = (perIp.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= PER_IP_MAX) {
    perIp.set(key, recent);
    return true;
  }

  recent.push(now);
  perIp.set(key, recent);
  globalLog.push(now);
  return false;
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
