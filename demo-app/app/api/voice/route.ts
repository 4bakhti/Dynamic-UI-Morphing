import { isElevenLabsConfigured, synthesizeSpeech } from "@/lib/server/elevenlabs";
import { isRateLimited, jsonResponse, readJson } from "@/lib/server/guards";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_TEXT_CHARS = 1_500;

/**
 * POST { text } → audio/mpeg spoken by ElevenLabs. Returns 503 with
 * { fallback: true } when no key is configured so the browser can fall back to
 * the Web Speech API and the demo keeps talking.
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return jsonResponse(400, { error: "Missing 'text'." });
  }
  if (text.length > MAX_TEXT_CHARS) {
    return jsonResponse(413, { error: `Text too long (max ${MAX_TEXT_CHARS} characters).` });
  }
  if (!isElevenLabsConfigured()) {
    return jsonResponse(503, { fallback: true, error: "ELEVENLABS_API_KEY is not configured." });
  }
  if (isRateLimited(req, "voice")) {
    return jsonResponse(429, { fallback: true, error: "Voice rate limit reached — wait a minute." });
  }

  try {
    const upstream = await synthesizeSpeech(text);
    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      return jsonResponse(502, {
        fallback: true,
        error: `ElevenLabs request failed (${upstream.status}). ${detail.slice(0, 200)}`,
      });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return jsonResponse(502, {
      fallback: true,
      error: error instanceof Error ? error.message : "ElevenLabs request failed.",
    });
  }
}
