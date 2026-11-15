import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Picks the LLM behind the Developing Agent. Google Gemini is the default;
 * OpenAI stays available as a fallback provider.
 *
 *   LLM_PROVIDER=gemini (default when GEMINI_API_KEY is set) | openai
 *   GEMINI_MODEL   default gemini-3.8-flash
 *   OPENAI_MODEL   default gpt-4o-mini
 */
export function resolveModel(): { model: LanguageModel; label: string } | { error: string } {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const provider = (
    process.env.LLM_PROVIDER || (geminiKey || !process.env.OPENAI_API_KEY ? "gemini" : "openai")
  ).toLowerCase();

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      return { error: "OPENAI_API_KEY is missing (LLM_PROVIDER=openai)." };
    }
    const id = process.env.OPENAI_MODEL || "gpt-4o-mini";
    return { model: openai(id), label: `OpenAI ${id}` };
  }

  if (!geminiKey) {
    return { error: "GEMINI_API_KEY is missing." };
  }
  const id = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const google = createGoogleGenerativeAI({ apiKey: geminiKey });
  return { model: google(id), label: `Google ${id}` };
}

export function missingModelMessage(error: string): string {
  return (
    `Server is not configured for live generation: ${error} ` +
    "Set the key in .env.local (and restart), or set DEMO_MODE=true."
  );
}
