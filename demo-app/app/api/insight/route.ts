import { DASHBOARD_MODES, type DashboardMode } from "@/lib/layoutConfig";
import { CHART_LABELS, CHART_SERIES, METRICS, NOTIFICATIONS } from "@/lib/mock-data";
import { GEMINI_MODEL, generateWithGemini, isGeminiConfigured } from "@/lib/server/gemini";
import { finiteNumber, isRateLimited, jsonResponse, readJson } from "@/lib/server/guards";

export const runtime = "nodejs";
export const maxDuration = 30;

type InsightKind = "nudge" | "outline" | "explain";
const KINDS = new Set<InsightKind>(["nudge", "outline", "explain"]);

const SYSTEM_PROMPT = `You are the adaptive copilot inside "Aurora Analytics", an enterprise dashboard built on the Dynamic UI Morphing framework. The framework measures cognitive load from numeric interaction telemetry only (timing, dwell, scroll reversals, error rates) — never from what the user types — and morphs the interface between four modes:
- Normal: everything visible.
- Focus: attention is dropping; peripheral panels hide and the report editor becomes a calm, centered canvas.
- Exploration: the user looks stuck or idle; low-priority panels dim and a helper appears on the editor.
- Clarity: fatigue or frustration (rage clicks, repeated errors); dense charts and feeds hide, text and click targets grow.
The composite score S_comp ranges from -3 to +3 (z-score units; higher means more strain).
Tone: warm, concise, plain English, no emojis, never clinical, never mention z-scores unless asked. Never invent personal details about the user.`;

function dashboardDataset(): string {
  const metrics = METRICS.map((m) => `${m.label}: ${m.value} (${m.delta >= 0 ? "+" : ""}${m.delta}% vs last period)`).join("\n");
  const series = CHART_SERIES.map(
    (s) => `${s.name} by month (${CHART_LABELS.join(", ")}): ${s.points.join(", ")}`,
  ).join("\n");
  const events = NOTIFICATIONS.map((n) => `${n.title} (${n.time})`).join("\n");
  return `KEY METRICS\n${metrics}\n\nREVENUE VS TARGET ($k)\n${series}\n\nRECENT EVENTS\n${events}`;
}

function buildPrompt(kind: InsightKind, mode: DashboardMode, score: number, activeSignals: number, transitions: number) {
  const telemetry = `Current mode: ${mode}. Composite score: ${score.toFixed(2)}. Active behaviour signals: ${activeSignals}. Mode transitions this session: ${transitions}.`;

  if (kind === "outline") {
    return `${telemetry}\n\nThe user is drafting the "Quarterly Report" in the editor and paused. Using ONLY the dataset below, write a report outline they can build on: a one-line headline, then 4-5 short bullet points ("- " prefix), each citing a concrete number from the data, and end with one suggested next step. Plain text, no markdown headings, under 120 words.\n\n${dashboardDataset()}`;
  }

  if (kind === "explain") {
    return `${telemetry}\n\nIn 2-3 sentences, explain to the user why the interface currently looks the way it does and what they can do (they can always flip the Lock Interface switch to stop automatic changes). Speak directly to them.`;
  }

  return `${telemetry}\n\nThe user seems to have paused on the report editor. Offer one short, encouraging nudge (max 30 words) with a concrete next action grounded in this data:\n\n${dashboardDataset()}`;
}

const FALLBACKS: Record<InsightKind, (mode: DashboardMode) => string> = {
  nudge: () =>
    "Stuck on the opener? Lead with the win: revenue is $482,300, up 4.8%, and it beat target in August. I can draft the full outline for you.",
  outline: () =>
    [
      "Q3: revenue outpaced target as growth accelerated into late summer",
      "- Revenue reached $482,300, up 4.8% on the previous period",
      "- Monthly revenue climbed from $32k in January to $70k in August, beating the $62k target",
      "- Active users grew 2.1% to 12,940 while churn eased 0.3 pts to 1.08%",
      "- Conversion dipped 0.6 pts to 3.42% — the one metric moving the wrong way",
      "- API latency crossed its threshold 14 minutes ago; worth flagging to engineering",
      "Next step: dig into the conversion dip before the board review.",
    ].join("\n"),
  explain: (mode) =>
    ({
      Normal: "Everything is visible because your interaction rhythm looks steady. If that changes, the layout will adapt — or flip Lock Interface to keep it exactly as it is.",
      Focus: "Your attention signals suggested you wanted to concentrate, so I tucked away every side panel and gave the report the full screen. Exit Focus or lock the interface any time.",
      Exploration: "You paused for a while, so I dimmed the busy panels and put a helper next to the report. Nothing was removed — it is all one glance away.",
      Clarity: "Repeated clicks and errors looked like frustration, so I hid the dense chart and feed and made text and buttons bigger. Lock the interface if you prefer the full view.",
    })[mode],
};

/**
 * POST { kind, mode, compositeScore, activeSignals, transitions } → { text, source }.
 * Only numeric telemetry and the dashboard's own aggregate dataset are sent
 * to Gemini — never anything the user typed.
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) {
    return jsonResponse(400, { error: "Request body must be valid JSON." });
  }

  const kind = KINDS.has(body.kind as InsightKind) ? (body.kind as InsightKind) : "nudge";
  const mode = DASHBOARD_MODES.includes(body.mode as DashboardMode) ? (body.mode as DashboardMode) : "Normal";
  const score = Math.max(-3, Math.min(3, finiteNumber(body.compositeScore)));
  const activeSignals = Math.max(0, Math.min(10, Math.round(finiteNumber(body.activeSignals))));
  const transitions = Math.max(0, Math.min(10_000, Math.round(finiteNumber(body.transitions))));

  const fallback = (reason: string) =>
    jsonResponse(200, { text: FALLBACKS[kind](mode), source: "fallback", reason });

  if (!isGeminiConfigured()) {
    return fallback("GEMINI_API_KEY is not configured.");
  }
  if (isRateLimited(req, "insight")) {
    return fallback("Gemini rate limit reached — showing a pre-written insight.");
  }

  try {
    const text = await generateWithGemini({
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(kind, mode, score, activeSignals, transitions),
      temperature: kind === "outline" ? 0.4 : 0.7,
    });
    return jsonResponse(200, { text, source: "gemini", model: GEMINI_MODEL });
  } catch (error) {
    return fallback(error instanceof Error ? error.message : "Gemini request failed.");
  }
}
