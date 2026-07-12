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

/** localStorage key holding the raw imported-layout JSON across refreshes. */
const LAYOUT_STORAGE_KEY = "demo-app:imported-layout";

function persistLayoutJson(json: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, json);
  } catch {
    // Private-mode / quota errors are non-fatal — the in-memory config still works.
  }
}

function clearPersistedLayout(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LAYOUT_STORAGE_KEY);
  } catch {
    // Ignore — nothing to clean up if storage is unavailable.
  }
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
  /** Re-applies a layout persisted from a previous session. Call once on mount. */
  hydrateLayoutConfig: () => void;
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
      persistLayoutJson(json);
    } catch (error) {
      set({ layoutImportError: error instanceof Error ? error.message : "Invalid JSON." });
    }
  },

  resetLayoutConfig: () => {
    clearPersistedLayout();
    set({ importedLayoutConfig: null, layoutImportError: null });
  },

  hydrateLayoutConfig: () => {
    if (typeof window === "undefined" || get().importedLayoutConfig) return;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    } catch {
      return;
    }
    if (!stored) return;
    try {
      const config = parseImportedLayoutConfig(JSON.parse(stored));
      set({ importedLayoutConfig: config, layoutImportError: null });
    } catch {
      // Stored value is stale/invalid (e.g. schema changed) — drop it.
      clearPersistedLayout();
    }
  },
}));
