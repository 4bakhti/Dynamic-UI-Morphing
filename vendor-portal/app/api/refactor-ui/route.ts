import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import {
  REFACTOR_SYSTEM_PROMPT,
  buildRefactorPrompt,
  DEMO_REFACTORED_CODE,
} from "@/lib/refactor";
import {
  clientKey,
  isRateLimited,
  jsonError,
  readString,
  streamCannedText,
} from "@/lib/apiGuards";

// Refactoring a full file can take longer than a small JSON config.
export const maxDuration = 60;

// A single pasted component should comfortably fit in these bounds; anything
// larger is either a mistake or an attempt to run up the OpenAI bill.
const MAX_CODE_CHARS = 40_000;
const MAX_GUIDELINES_CHARS = 4_000;
// Bounds the cost of a single response regardless of what the model decides.
const MAX_OUTPUT_TOKENS = 4_096;

export async function POST(req: Request) {
  // --- Guard against malformed / non-JSON bodies ---------------------------
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Request body must be valid JSON.");
  }

  const code = readString(body, "code");
  const guidelines = readString(body, "guidelines") ?? "";

  if (!code || !code.trim()) {
    return jsonError(400, "Missing or invalid 'code'. Paste a component to refactor.");
  }

  if (code.length > MAX_CODE_CHARS) {
    return jsonError(
      413,
      `'code' is too large (${code.length} chars, max ${MAX_CODE_CHARS}). Paste a single component file.`,
    );
  }

  if (guidelines.length > MAX_GUIDELINES_CHARS) {
    return jsonError(
      413,
      `'guidelines' is too large (${guidelines.length} chars, max ${MAX_GUIDELINES_CHARS}).`,
    );
  }

  // --- Demo safety net -----------------------------------------------------
  // Stream the exact pre-verified refactor, chunked, so the agent still *looks*
  // like it is rewriting the file live while remaining 100% deterministic.
  // Checked before the API-key guard so the demo runs with no key at all, and
  // before the rate limiter so an on-stage demo can never be throttled.
  if (process.env.DEMO_MODE === "true") {
    return streamCannedText(DEMO_REFACTORED_CODE);
  }

  // --- Rate limit the paid path ---------------------------------------------
  if (isRateLimited(clientKey(req))) {
    return jsonError(429, "Too many refactor requests. Wait a minute and try again.");
  }

  // --- Pre-flight API key check --------------------------------------------
  if (!process.env.OPENAI_API_KEY) {
    return jsonError(
      500,
      "Server is not configured for live generation: OPENAI_API_KEY is missing. " +
        "Set the key in .env.local (and restart), or set DEMO_MODE=true.",
    );
  }

  // --- Live Developing Agent (code refactor) -------------------------------
  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: REFACTOR_SYSTEM_PROMPT,
    prompt: buildRefactorPrompt(code, guidelines),
    temperature: 0.2,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });

  // Plain text stream of the refactored source, read directly by the client.
  return result.toTextStreamResponse();
}
