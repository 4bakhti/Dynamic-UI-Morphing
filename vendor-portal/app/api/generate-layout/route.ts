import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import {
  layoutSchema,
  SYSTEM_PROMPT,
  DEMO_OUTPUT,
} from "@/lib/schema";

// Allow up to 30s for the live generation to finish streaming.
export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt } = (await req.json()) as { prompt?: string };

  if (!prompt || !prompt.trim()) {
    return new Response(JSON.stringify({ error: "Missing prompt." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- Demo safety net -----------------------------------------------------
  // Stream the exact pre-compiled JSON, chunked, so the agent still *looks*
  // like it is generating live while remaining 100% deterministic on stage.
  if (process.env.DEMO_MODE === "true") {
    return streamCannedJson();
  }

  // --- Live Developing Agent ----------------------------------------------
  const result = streamObject({
    model: openai("gpt-4o-mini"),
    schema: layoutSchema,
    system: SYSTEM_PROMPT,
    prompt,
    temperature: 0.2,
  });

  // Plain text stream of partial JSON, consumed by `useObject` on the client.
  return result.toTextStreamResponse();
}

function streamCannedJson(): Response {
  const json = JSON.stringify(DEMO_OUTPUT);
  const encoder = new TextEncoder();
  const chunkSize = 6;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (let i = 0; i < json.length; i += chunkSize) {
        controller.enqueue(encoder.encode(json.slice(i, i + chunkSize)));
        // Pacing so the "thinking" animation reads well during the demo.
        await new Promise((r) => setTimeout(r, 22));
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
