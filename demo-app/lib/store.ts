import { create } from "zustand";
import { parseImportedLayoutConfig, type DashboardMode, type FullLayoutConfig } from "./layoutConfig";

/**
 * "system" = a background cognitive-signal trigger (the real BehaviourEngine,
 * or this demo's signal simulator). "manual" = the human acting directly.
 * Only "system" requests are blocked while the interface is locked.
 */
export type ModeSource = "system" | "manual";

export interface IgnoredAttempt {
  mode: DashboardMode;
  at: number;
}

export interface DashboardState {
  currentMode: DashboardMode;
  isInterfaceLocked: boolean;
  lastIgnoredAttempt: IgnoredAttempt | null;
  /** Non-null when a Developing Agent JSON config has been imported. */
  importedLayoutConfig: FullLayoutConfig | null;
  layoutImportError: string | null;
  setMode: (mode: DashboardMode, source?: ModeSource) => void;
  toggleLock: () => void;
  clearIgnoredAttempt: () => void;
  importLayoutConfig: (json: string) => void;
  resetLayoutConfig: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  currentMode: "Normal",
  isInterfaceLocked: false,
  lastIgnoredAttempt: null,
  importedLayoutConfig: null,
  layoutImportError: null,

  setMode: (mode, source = "manual") => {
    if (source === "system" && get().isInterfaceLocked) {
      set({ lastIgnoredAttempt: { mode, at: Date.now() } });
      return;
    }

    if (mode === get().currentMode) {
      return;
    }

    set({ currentMode: mode, lastIgnoredAttempt: null });
  },

  toggleLock: () => set((state) => ({ isInterfaceLocked: !state.isInterfaceLocked })),

  clearIgnoredAttempt: () => set({ lastIgnoredAttempt: null }),

  importLayoutConfig: (json) => {
    try {
      const parsed = JSON.parse(json);
      const config = parseImportedLayoutConfig(parsed);
      set({ importedLayoutConfig: config, layoutImportError: null });
    } catch (error) {
      set({ layoutImportError: error instanceof Error ? error.message : "Invalid JSON." });
    }
  },

  resetLayoutConfig: () => set({ importedLayoutConfig: null, layoutImportError: null }),
}));
