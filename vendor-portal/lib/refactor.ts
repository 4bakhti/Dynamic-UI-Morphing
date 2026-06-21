/**
 * The Developing Agent, reimagined as a Direct Code Refactoring Engine.
 *
 * Instead of emitting a JSON config, the agent ingests the vendor's raw
 * React/Next.js component source plus optional design guidelines, and rewrites
 * the file in place — injecting a Zustand state hook, conditional Tailwind
 * styling, and short-circuit visibility gates for the three cognitive modes.
 */

export const REFACTOR_SYSTEM_PROMPT = `You are an advanced AI Code Refactoring Agent specializing in Next.js, React, and TypeScript. Your job is to act as the "Developing Agent" for an adaptive UI framework.

INPUT PROVIDES:
1. The user's original raw React/Next.js frontend component code.
2. The user's custom instructions or design guidelines.

YOUR TASKS:
1. Parse the provided component code.
2. Inject a global state check using a mock Zustand store hook: \`const { currentMode } = useUIStore();\`.
3. Modify the layout rendering logic so the interface responds dynamically to three states: "FocusMode", "ExplorationMode", and "ClarityMode".
4. Apply the following structural alterations directly to the code components using conditional Tailwind CSS classes or short-circuit rendering, incorporating any user guidelines:
   - FocusMode: Hide peripheral elements, center the main workspace container.
   - ExplorationMode: Retain key workspace components, dim background charts/feeds via 'opacity-30', and inject an active help tooltip widget next to the dominant interaction field.
   - ClarityMode: Hide low-priority feeds, increase text weights, expand padding/margins, and enlarge interactive click targets.
5. Return the full, functional, refactored React component code.

OUTPUT CONSTRAINTS:
- Output ONLY the raw, functional source code.
- Do NOT wrap the code inside markdown blocks (e.g., no \`\`\`tsx or \`\`\`javascript).
- Do NOT provide explanations, summary logs, or greetings. Start immediately with the first line of code imports.`;

/** Combines the raw code and guidelines into a single user message. */
export function buildRefactorPrompt(code: string, guidelines: string): string {
  const trimmedGuidelines = guidelines.trim();
  return [
    "ORIGINAL COMPONENT CODE:",
    code,
    "",
    "CUSTOM GUIDELINES:",
    trimmedGuidelines.length > 0
      ? trimmedGuidelines
      : "None provided — apply sensible defaults for the three modes.",
  ].join("\n");
}

/** Raw, un-optimized dashboard the vendor pastes during the demo. */
export const DEMO_SOURCE_CODE = `import { SidebarNavigation } from "@/components/SidebarNavigation";
import { TopMetricsRibbon } from "@/components/TopMetricsRibbon";
import { MainDataChart } from "@/components/MainDataChart";
import { ReportEditorTextarea } from "@/components/ReportEditorTextarea";
import { NotificationFeed } from "@/components/NotificationFeed";

export default function Dashboard() {
  return (
    <div className="flex h-screen w-full bg-slate-50">
      <SidebarNavigation />
      <main className="flex flex-1 flex-col gap-6 p-8">
        <TopMetricsRibbon />
        <MainDataChart />
        <ReportEditorTextarea />
      </main>
      <NotificationFeed />
    </div>
  );
}
`;

/** Example layout guidelines the vendor types alongside the code. */
export const DEMO_GUIDELINES = `Keep the report editor as the primary workspace. The notification feed and data chart are the lowest priority. In Clarity mode make the sidebar large and bold.`;

/**
 * Hackathon demo safety net. When DEMO_MODE=true the API route streams this
 * exact refactored file instead of calling the LLM, guaranteeing a clean,
 * bug-free on-stage result that still animates as if generated live.
 */
export const DEMO_REFACTORED_CODE = `import { SidebarNavigation } from "@/components/SidebarNavigation";
import { TopMetricsRibbon } from "@/components/TopMetricsRibbon";
import { MainDataChart } from "@/components/MainDataChart";
import { ReportEditorTextarea } from "@/components/ReportEditorTextarea";
import { NotificationFeed } from "@/components/NotificationFeed";
import { HelpTooltip } from "@/components/HelpTooltip";
import { useUIStore } from "@/store/useUIStore";

export default function Dashboard() {
  const { currentMode } = useUIStore();

  const isFocus = currentMode === "FocusMode";
  const isExploration = currentMode === "ExplorationMode";
  const isClarity = currentMode === "ClarityMode";

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {!isFocus && (
        <SidebarNavigation
          className={isClarity ? "text-xl font-bold p-8" : ""}
        />
      )}

      <main
        className={[
          "flex flex-1 flex-col gap-6 p-8",
          isFocus && "mx-auto max-w-4xl items-center justify-center",
          isClarity && "gap-10 p-12",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {!isFocus && (
          <TopMetricsRibbon
            className={
              isExploration ? "opacity-30" : isClarity ? "grid-cols-1" : ""
            }
          />
        )}

        {!isFocus && !isClarity && (
          <MainDataChart className={isExploration ? "opacity-30" : ""} />
        )}

        <div className="relative w-full">
          <ReportEditorTextarea
            className={[
              isFocus && "w-full max-w-4xl mx-auto shadow-none",
              isClarity && "text-lg p-6",
            ]
              .filter(Boolean)
              .join(" ")}
          />
          {isExploration && <HelpTooltip target="ReportEditorTextarea" />}
        </div>
      </main>

      {!isFocus && !isClarity && <NotificationFeed />}
    </div>
  );
}
`;
