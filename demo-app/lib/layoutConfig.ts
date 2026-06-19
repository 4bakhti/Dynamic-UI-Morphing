export type ComponentName =
  | "SidebarNavigation"
  | "TopMetricsRibbon"
  | "MainDataChart"
  | "ReportEditorTextarea"
  | "NotificationFeed";

export type DashboardMode = "Normal" | "Focus" | "Exploration" | "Clarity";

export const DASHBOARD_MODES: DashboardMode[] = ["Normal", "Focus", "Exploration", "Clarity"];

interface ModeLayout {
  visibleComponents: ComponentName[];
  hiddenComponents: ComponentName[];
  cssOverrides: Partial<Record<ComponentName, string>>;
  aiAssistance: boolean;
  helpTooltipTarget?: ComponentName;
}

const ALL_COMPONENTS: ComponentName[] = [
  "SidebarNavigation",
  "TopMetricsRibbon",
  "MainDataChart",
  "ReportEditorTextarea",
  "NotificationFeed",
];

/**
 * Mirrors the FocusMode/ExplorationMode/ClarityMode contract the Developing
 * Agent emits (vendor-portal/lib/schema.ts DEMO_OUTPUT) so the pre-embedded
 * live demo and the vendor-portal preview never disagree about a mode's
 * shape. "Normal" has no analog there since it is simply "nothing hidden."
 */
export const LAYOUT_CONFIG: Record<DashboardMode, ModeLayout> = {
  Normal: {
    visibleComponents: ALL_COMPONENTS,
    hiddenComponents: [],
    cssOverrides: {},
    aiAssistance: false,
  },
  Focus: {
    visibleComponents: ["ReportEditorTextarea"],
    hiddenComponents: ["SidebarNavigation", "TopMetricsRibbon", "MainDataChart", "NotificationFeed"],
    cssOverrides: {
      ReportEditorTextarea: "w-full max-w-4xl mx-auto shadow-none",
    },
    aiAssistance: false,
  },
  Exploration: {
    visibleComponents: ["SidebarNavigation", "ReportEditorTextarea"],
    hiddenComponents: ["TopMetricsRibbon", "MainDataChart", "NotificationFeed"],
    cssOverrides: {
      ReportEditorTextarea: "opacity-75",
    },
    aiAssistance: true,
    helpTooltipTarget: "ReportEditorTextarea",
  },
  Clarity: {
    // TopMetricsRibbon stays visible-but-simplified (see cssOverrides below);
    // it must be listed here so every component resolves to visible or
    // hidden in every mode.
    visibleComponents: ["SidebarNavigation", "TopMetricsRibbon", "ReportEditorTextarea"],
    hiddenComponents: ["NotificationFeed", "MainDataChart"],
    cssOverrides: {
      SidebarNavigation: "text-xl font-bold p-8",
      TopMetricsRibbon: "grid-cols-1",
      ReportEditorTextarea: "text-lg",
    },
    aiAssistance: false,
  },
};

export function isComponentVisible(component: ComponentName, mode: DashboardMode): boolean {
  return LAYOUT_CONFIG[mode].visibleComponents.includes(component);
}

export function getOverrideClasses(component: ComponentName, mode: DashboardMode): string {
  return LAYOUT_CONFIG[mode].cssOverrides[component] ?? "";
}

export function getHelpTooltipTarget(mode: DashboardMode): ComponentName | null {
  return LAYOUT_CONFIG[mode].helpTooltipTarget ?? null;
}
