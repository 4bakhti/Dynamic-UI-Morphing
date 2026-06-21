import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import {
  REFACTOR_SYSTEM_PROMPT,
  buildRefactorPrompt,
  DEMO_REFACTORED_CODE,
} from "@/lib/refactor";

// Refactoring a full file can take longer than a small JSON config.
export const maxDuration = 60;

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

  // --- Demo safety net -----------------------------------------------------
  // Stream the exact pre-verified refactor, chunked, so the agent still *looks*
  // like it is rewriting the file live while remaining 100% deterministic.
  // Checked before the API-key guard so the demo runs with no key at all.
  if (process.env.DEMO_MODE === "true") {
    return streamCannedCode(DEMO_REFACTORED_CODE);
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
  });

  // Plain text stream of the refactored source, read directly by the client.
  return result.toTextStreamResponse();
}

function readString(body: unknown, key: string): string | undefined {
  if (body && typeof body === "object" && key in body) {
    const value = (body as Record<string, unknown>)[key];
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function streamCannedCode(source: string): Response {
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
