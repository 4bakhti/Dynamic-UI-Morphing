/**
 * Minimal ElevenLabs text-to-speech client (REST, no SDK). Server-only: the
 * key never reaches the browser; the route streams back plain audio/mpeg.
 */

const ELEVENLABS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";
export const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2_5";
// "George" — a warm, calm premade voice available on every ElevenLabs account.
export const ELEVENLABS_VOICE = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";

export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

export async function synthesizeSpeech(text: string): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }

  return fetch(
    `${ELEVENLABS_ENDPOINT}/${encodeURIComponent(ELEVENLABS_VOICE)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.2 },
      }),
      signal: AbortSignal.timeout(20_000),
    },
  );
}
