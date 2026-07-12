import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import {
  layoutSchema,
  LAYOUT_SYSTEM_PROMPT,
  buildLayoutPrompt,
  DEMO_OUTPUT,
} from "@/lib/schema";
import {
  accessCodeGate,
  clientKey,
  isRateLimited,
  jsonError,
  readString,
  streamCannedText,
} from "@/lib/apiGuards";

export const maxDuration = 30;

// A plain-text app description is short; these caps stop bill-padding abuse.
const MAX_DESCRIPTION_CHARS = 8_000;
const MAX_GUIDELINES_CHARS = 4_000;

export async function POST(req: Request) {
  // --- Guard against malformed / non-JSON bodies ---------------------------
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Request body must be valid JSON.");
  }

  const description = readString(body, "description");
  const guidelines = readString(body, "guidelines") ?? "";

  if (!description || !description.trim()) {
    return jsonError(400, "Missing or invalid 'description'. Describe your app's components.");
  }

  if (description.length > MAX_DESCRIPTION_CHARS) {
    return jsonError(
      413,
      `'description' is too large (${description.length} chars, max ${MAX_DESCRIPTION_CHARS}).`,
    );
  }

  if (guidelines.length > MAX_GUIDELINES_CHARS) {
    return jsonError(
      413,
      `'guidelines' is too large (${guidelines.length} chars, max ${MAX_GUIDELINES_CHARS}).`,
    );
  }

  // --- Demo safety net -----------------------------------------------------
  // Stream the exact pre-verified config, chunked, so the agent still *looks*
  // live while remaining 100% deterministic. Checked before the API-key guard
  // so the demo runs with no key, and before the rate limiter so an on-stage
  // demo can never be throttled.
  if (process.env.DEMO_MODE === "true") {
    return streamCannedText(JSON.stringify(DEMO_OUTPUT, null, 2));
  }

  // --- Access-code gate (no-op unless PORTAL_ACCESS_CODE is set) ------------
  const gated = accessCodeGate(req);
  if (gated) {
    return gated;
  }

  // --- Rate limit the paid path ---------------------------------------------
  if (await isRateLimited(clientKey(req))) {
    return jsonError(429, "Too many generation requests. Wait a minute and try again.");
  }

  // --- Pre-flight API key check --------------------------------------------
  if (!process.env.OPENAI_API_KEY) {
    return jsonError(
      500,
      "Server is not configured for live generation: OPENAI_API_KEY is missing. " +
        "Set the key in .env.local (and restart), or set DEMO_MODE=true.",
    );
  }

  // --- Live Developing Agent (layout JSON) ----------------------------------
  // The Zod schema constrains every component name and field, so the model
  // structurally cannot emit a config the demo app fails to parse.
  const result = streamObject({
    model: openai("gpt-4o-mini"),
    schema: layoutSchema,
    system: LAYOUT_SYSTEM_PROMPT,
    prompt: buildLayoutPrompt(description, guidelines),
    temperature: 0.2,
  });

  // Streams the config as JSON text, read directly by the client.
  return result.toTextStreamResponse();
}
