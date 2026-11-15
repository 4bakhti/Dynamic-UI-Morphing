import { create } from "zustand";
import { parseImportedLayoutConfig, type DashboardMode, type FullLayoutConfig } from "./layoutConfig";
import { MAX_LEDGER_ENTRIES, type LedgerEntry } from "./ledger";

export const DEFAULT_REPORT_TEXT =
  "Q3 performance exceeded targets across all regions. Revenue grew 12% quarter-over-quarter, driven primarily by...";

function newSessionId(): string {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function appendEntry(
  ledger: LedgerEntry[],
  entry: Omit<LedgerEntry, "seq" | "at">,
): LedgerEntry[] {
  const next = [...ledger, { ...entry, seq: (ledger.at(-1)?.seq ?? 0) + 1, at: Date.now() }];
  return next.length > MAX_LEDGER_ENTRIES ? next.slice(-MAX_LEDGER_ENTRIES) : next;
}

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
  /** Report draft, shared by the normal and Focus-mode editors. */
  reportText: string;
  /** Every morph, human override and blocked signal — the Solana ledger's source. */
  ledger: LedgerEntry[];
  sessionId: string;
  setReportText: (text: string) => void;
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
  reportText: DEFAULT_REPORT_TEXT,
  ledger: [],
  sessionId: newSessionId(),

  setReportText: (text) => set({ reportText: text }),

  setMode: (mode, source = "manual") => {
    const { currentMode, isInterfaceLocked, ledger } = get();

    if (source === "system" && isInterfaceLocked) {
      set({
        lastIgnoredAttempt: { mode, at: Date.now() },
        ledger:
          mode === currentMode
            ? ledger
            : appendEntry(ledger, { event: "blocked", from: currentMode, to: mode, source }),
      });
      return;
    }

    if (mode === currentMode) {
      return;
    }

    set({
      currentMode: mode,
      lastIgnoredAttempt: null,
      ledger: appendEntry(ledger, { event: "mode", from: currentMode, to: mode, source }),
    });
  },

  toggleLock: () =>
    set((state) => ({
      isInterfaceLocked: !state.isInterfaceLocked,
      ledger: appendEntry(state.ledger, {
        event: state.isInterfaceLocked ? "unlock" : "lock",
        from: state.currentMode,
        to: state.currentMode,
        source: "manual",
      }),
    })),

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
