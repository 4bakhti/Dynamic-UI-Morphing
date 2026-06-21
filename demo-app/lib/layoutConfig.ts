export type ComponentName =
  | "SidebarNavigation"
  | "TopMetricsRibbon"
  | "MainDataChart"
  | "ReportEditorTextarea"
  | "NotificationFeed";

export type DashboardMode = "Normal" | "Focus" | "Exploration" | "Clarity";

export const DASHBOARD_MODES: DashboardMode[] = ["Normal", "Focus", "Exploration", "Clarity"];

export interface ModeLayout {
  visibleComponents: ComponentName[];
  hiddenComponents: ComponentName[];
  cssOverrides: Partial<Record<ComponentName, string>>;
  aiAssistance: boolean;
  helpTooltipTarget?: ComponentName;
}

export type FullLayoutConfig = Record<DashboardMode, ModeLayout>;

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
export const LAYOUT_CONFIG: FullLayoutConfig = {
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
      ReportEditorTextarea: "mx-auto min-h-screen w-full max-w-5xl shadow-none",
    },
    aiAssistance: false,
  },
  Exploration: {
    visibleComponents: ALL_COMPONENTS,
    hiddenComponents: [],
    cssOverrides: {
      SidebarNavigation: "opacity-40 transition-opacity duration-300",
      TopMetricsRibbon: "opacity-40 transition-opacity duration-300",
      MainDataChart: "opacity-30 transition-opacity duration-300",
      NotificationFeed: "opacity-30 transition-opacity duration-300",
      ReportEditorTextarea:
        "relative z-10 opacity-100 ring-2 ring-emerald-300/80 shadow-xl shadow-emerald-100 transition-all duration-300",
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

export function isComponentVisible(
  component: ComponentName,
  mode: DashboardMode,
  config: FullLayoutConfig = LAYOUT_CONFIG,
): boolean {
  return config[mode].visibleComponents.includes(component);
}

export function getOverrideClasses(
  component: ComponentName,
  mode: DashboardMode,
  config: FullLayoutConfig = LAYOUT_CONFIG,
): string {
  return config[mode].cssOverrides[component] ?? "";
}

export function getHelpTooltipTarget(
  mode: DashboardMode,
  config: FullLayoutConfig = LAYOUT_CONFIG,
): ComponentName | null {
  return config[mode].helpTooltipTarget ?? null;
}

const KNOWN_COMPONENTS = new Set<string>(ALL_COMPONENTS);

function isComponentName(value: unknown): value is ComponentName {
  return typeof value === "string" && KNOWN_COMPONENTS.has(value);
}

function parseModeLayout(value: unknown, path: string): ModeLayout {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${path} must be an object`);
  }

  const raw = value as Record<string, unknown>;

  const visibleComponents = Array.isArray(raw.visibleComponents)
    ? raw.visibleComponents.filter(isComponentName)
    : [];
  const hiddenComponents = Array.isArray(raw.hiddenComponents)
    ? raw.hiddenComponents.filter(isComponentName)
    : [];

  const cssOverrides: Partial<Record<ComponentName, string>> = {};
  if (typeof raw.cssOverrides === "object" && raw.cssOverrides !== null) {
    for (const [key, classes] of Object.entries(raw.cssOverrides as Record<string, unknown>)) {
      if (isComponentName(key) && typeof classes === "string") {
        cssOverrides[key] = classes;
      }
    }
  }

  const helpTooltipTarget = isComponentName(raw.helpTooltipTarget) ? raw.helpTooltipTarget : undefined;

  return {
    visibleComponents,
    hiddenComponents,
    cssOverrides,
    aiAssistance: raw.aiAssistance === true,
    helpTooltipTarget,
  };
}

/**
 * Parses the exact JSON the Developing Agent's UI lets you copy (the
 * FocusMode/ExplorationMode/ClarityMode shape from
 * vendor-portal/lib/schema.ts's layoutSchema) into this app's layout config,
 * keeping "Normal" as the unaffected "everything visible" baseline.
 */
export function parseImportedLayoutConfig(json: unknown): FullLayoutConfig {
  if (typeof json !== "object" || json === null) {
    throw new Error("Expected a JSON object with FocusMode, ExplorationMode, and ClarityMode.");
  }

  const raw = json as Record<string, unknown>;
  if (!("FocusMode" in raw) || !("ExplorationMode" in raw) || !("ClarityMode" in raw)) {
    throw new Error("JSON must include FocusMode, ExplorationMode, and ClarityMode keys.");
  }

  return {
    Normal: LAYOUT_CONFIG.Normal,
    Focus: parseModeLayout(raw.FocusMode, "FocusMode"),
    Exploration: parseModeLayout(raw.ExplorationMode, "ExplorationMode"),
    Clarity: parseModeLayout(raw.ClarityMode, "ClarityMode"),
  };
}
