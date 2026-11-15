import { ELEVENLABS_MODEL, isElevenLabsConfigured } from "@/lib/server/elevenlabs";
import { GEMINI_MODEL, isGeminiConfigured } from "@/lib/server/gemini";
import { jsonResponse } from "@/lib/server/guards";
import { SOLANA_CLUSTER, isSolanaConfigured } from "@/lib/server/solana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Which sponsor integrations are live vs. running on their offline fallback. */
export async function GET() {
  return jsonResponse(200, {
    gemini: { live: isGeminiConfigured(), model: GEMINI_MODEL },
    elevenlabs: { live: isElevenLabsConfigured(), model: ELEVENLABS_MODEL },
    solana: { live: isSolanaConfigured(), cluster: SOLANA_CLUSTER },
  });
}
