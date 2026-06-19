import { z } from "zod";

/**
 * The strict layout-state contract that the Developing Agent must produce and
 * that the Behaviour Agent / live dashboard consumes. Enforced end-to-end via
 * the Vercel AI SDK `streamObject`, so the LLM physically cannot emit a payload
 * that breaks Abdurahmon's frontend.
 */

const cssOverrides = z
  .record(z.string())
  .describe("Map of component name -> Tailwind classes to apply.");

const focusMode = z.object({
  visibleComponents: z
    .array(z.string())
    .describe("Component names to keep visible. Focus hides peripheral noise."),
  hiddenComponents: z
    .array(z.string())
    .describe("Component names to hide so the user centers on the primary task."),
  cssOverrides,
  aiAssistance: z.boolean(),
});

const explorationMode = z.object({
  visibleComponents: z.array(z.string()),
  hiddenComponents: z.array(z.string()),
  cssOverrides,
  aiAssistance: z.boolean(),
  helpTooltipTarget: z
    .string()
    .describe("Component name the AI helper tooltip attaches to."),
});

const clarityMode = z.object({
  visibleComponents: z.array(z.string()),
  hiddenComponents: z.array(z.string()),
  cssOverrides,
  aiAssistance: z.boolean(),
});

export const layoutSchema = z.object({
  FocusMode: focusMode,
  ExplorationMode: explorationMode,
  ClarityMode: clarityMode,
});

export type LayoutConfig = z.infer<typeof layoutSchema>;

/**
 * The Developing Agent system prompt. The JSON *shape* is guaranteed by the Zod
 * schema above, so this prompt focuses on the design intent of each cognitive
 * state rather than restating the schema.
 */
export const SYSTEM_PROMPT = `You are an expert Frontend Systems Architect and UI/UX Engineer acting as the "Developing Agent" within an adaptive UI framework.

Your objective is to analyze the structural description of a vendor's application and generate strict, predictable layout configurations for three specific cognitive states. The vendor application is built with Next.js and Tailwind CSS. The user provides the list of core React components that make up their interface.

Produce a configuration for three distinct modes. The Behaviour Agent switches between them based on real-time DOM telemetry:

1. "FocusMode": Triggered by high mouse velocity / erratic movement. Hide all peripheral noise and center the user on the primary input task. Keep only the single most task-critical component visible; hide everything else. aiAssistance must be false.

2. "ExplorationMode": Triggered by high idle dwell time (stupor). Surface contextual help and reduce the density of data visualizations. Hide dense charts/metrics, keep navigation and the primary task component, soften visuals via cssOverrides (e.g. reduced opacity). aiAssistance must be true and helpTooltipTarget should point at the primary task component.

3. "ClarityMode": Triggered by rage-clicking or rapid tab-switching. Aggressively simplify navigation and enlarge click targets to reduce frustration. Hide noisy feeds and charts, enlarge nav text/padding and collapse multi-column grids via cssOverrides. aiAssistance must be false.

Rules:
- Only reference component names the vendor actually listed (strip angle brackets, e.g. "<SidebarNavigation>" -> "SidebarNavigation").
- Every listed component must appear in either visibleComponents or hiddenComponents for each mode.
- cssOverrides values are valid Tailwind utility class strings.`;

/**
 * Hackathon demo safety net. When DEMO_MODE=true the API route streams this
 * exact object instead of calling OpenAI, guaranteeing the on-stage output
 * matches Abdurahmon's pre-compiled live configuration.
 */
export const DEMO_OUTPUT: LayoutConfig = {
  FocusMode: {
    visibleComponents: ["ReportEditorTextarea"],
    hiddenComponents: [
      "SidebarNavigation",
      "TopMetricsRibbon",
      "MainDataChart",
      "NotificationFeed",
    ],
    cssOverrides: {
      ReportEditorTextarea: "w-full max-w-4xl mx-auto shadow-none",
    },
    aiAssistance: false,
  },
  ExplorationMode: {
    visibleComponents: ["SidebarNavigation", "ReportEditorTextarea"],
    hiddenComponents: ["TopMetricsRibbon", "MainDataChart", "NotificationFeed"],
    cssOverrides: {
      ReportEditorTextarea: "opacity-75",
    },
    aiAssistance: true,
    helpTooltipTarget: "ReportEditorTextarea",
  },
  ClarityMode: {
    visibleComponents: ["SidebarNavigation", "TopMetricsRibbon", "ReportEditorTextarea"],
    hiddenComponents: ["NotificationFeed", "MainDataChart"],
    cssOverrides: {
      SidebarNavigation: "text-xl font-bold p-8",
      TopMetricsRibbon: "grid-cols-1",
    },
    aiAssistance: false,
  },
};

/** The structural description Asfand pastes during the demo. */
export const DEMO_PROMPT =
  "My app has a <SidebarNavigation>, <TopMetricsRibbon>, <MainDataChart>, <ReportEditorTextarea>, and <NotificationFeed>.";
