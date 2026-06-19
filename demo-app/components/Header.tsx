"use client";

import { useEffect, useState } from "react";
import { Activity, FileJson, Lock, LockOpen, Radio, RotateCcw } from "lucide-react";
import { useDashboardStore } from "@/lib/store";
import { DASHBOARD_MODES, type DashboardMode } from "@/lib/layoutConfig";
import type { LiveSignalState } from "@/lib/behaviourBridge";
import { ModeBadge } from "./ui/Badge";
import { Switch } from "./ui/Switch";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";

const IGNORED_BANNER_MS = 2600;

export function Header({ liveSignal }: { liveSignal: LiveSignalState }) {
  const currentMode = useDashboardStore((state) => state.currentMode);
  const isInterfaceLocked = useDashboardStore((state) => state.isInterfaceLocked);
  const lastIgnoredAttempt = useDashboardStore((state) => state.lastIgnoredAttempt);
  const importedLayoutConfig = useDashboardStore((state) => state.importedLayoutConfig);
  const setMode = useDashboardStore((state) => state.setMode);
  const toggleLock = useDashboardStore((state) => state.toggleLock);
  const clearIgnoredAttempt = useDashboardStore((state) => state.clearIgnoredAttempt);
  const resetLayoutConfig = useDashboardStore((state) => state.resetLayoutConfig);

  const [showIgnoredBanner, setShowIgnoredBanner] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);

  useEffect(() => {
    if (!lastIgnoredAttempt) {
      return;
    }

    setShowIgnoredBanner(true);
    const timer = setTimeout(() => {
      setShowIgnoredBanner(false);
      clearIgnoredAttempt();
    }, IGNORED_BANNER_MS);

    return () => clearTimeout(timer);
  }, [lastIgnoredAttempt, clearIgnoredAttempt]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-slate-900">Enterprise Data Analytics</h1>
          <ModeBadge mode={currentMode} />
          <LiveSignalBadge liveSignal={liveSignal} />
        </div>

        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-1 py-1"
            title="Simulates the background cognitive-signal engine — respects the lock below"
          >
            {DASHBOARD_MODES.map((mode) => (
              <SimulateButton
                key={mode}
                mode={mode}
                active={mode === currentMode}
                onTrigger={() => setMode(mode, "system")}
              />
            ))}
          </div>

          {importedLayoutConfig ? (
            <button
              onClick={resetLayoutConfig}
              title="Using a layout imported from the Developing Agent — click to reset to default"
              className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
            >
              <RotateCcw className="h-3 w-3" />
              Custom layout active
            </button>
          ) : (
            <Button variant="ghost" className="text-xs" onClick={() => setShowImportPanel((open) => !open)}>
              <FileJson className="h-3.5 w-3.5" />
              Import Layout JSON
            </Button>
          )}

          <div className="flex items-center gap-2">
            {isInterfaceLocked ? (
              <Lock className="h-4 w-4 text-brand" />
            ) : (
              <LockOpen className="h-4 w-4 text-slate-400" />
            )}
            <span className="text-sm font-medium text-slate-700">Lock Interface</span>
            <Switch checked={isInterfaceLocked} onCheckedChange={toggleLock} label="Lock interface" />
          </div>
        </div>
      </div>

      {showIgnoredBanner && lastIgnoredAttempt && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-600">
          <Lock className="h-3.5 w-3.5" />
          Interface locked — ignored background signal: {lastIgnoredAttempt.mode} Mode
        </p>
      )}

      {showImportPanel && <ImportLayoutPanel onClose={() => setShowImportPanel(false)} />}
    </header>
  );
}

function ImportLayoutPanel({ onClose }: { onClose: () => void }) {
  const importLayoutConfig = useDashboardStore((state) => state.importLayoutConfig);
  const layoutImportError = useDashboardStore((state) => state.layoutImportError);
  const [draft, setDraft] = useState("");

  const handleApply = () => {
    importLayoutConfig(draft);
    if (useDashboardStore.getState().importedLayoutConfig) {
      onClose();
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">
        Paste the JSON copied from the Developing Agent (vendor-portal) — the same{" "}
        <code className="rounded bg-slate-200 px-1 py-0.5 text-[11px]">FocusMode</code> /{" "}
        <code className="rounded bg-slate-200 px-1 py-0.5 text-[11px]">ExplorationMode</code> /{" "}
        <code className="rounded bg-slate-200 px-1 py-0.5 text-[11px]">ClarityMode</code> shape it generates.
      </p>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        spellCheck={false}
        placeholder='{"FocusMode": {...}, "ExplorationMode": {...}, "ClarityMode": {...}}'
        className="mt-2 h-32 w-full resize-none rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 outline-none focus:border-brand/60"
      />
      {layoutImportError && <p className="mt-1 text-xs font-medium text-rose-600">{layoutImportError}</p>}
      <div className="mt-3 flex items-center gap-2">
        <Button variant="primary" className="text-xs" onClick={handleApply} disabled={!draft.trim()}>
          Apply layout
        </Button>
        <Button variant="secondary" className="text-xs" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function LiveSignalBadge({ liveSignal }: { liveSignal: LiveSignalState }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500"
      title="Real BehaviourEngine telemetry from this page, separate from the simulate pills"
    >
      <Activity className="h-3 w-3" />
      {liveSignal.ready
        ? `Live signal: ${liveSignal.compositeScore.toFixed(2)} (${liveSignal.activeSignals} active)`
        : "Live signal: calibrating…"}
    </span>
  );
}

function SimulateButton({
  mode,
  active,
  onTrigger,
}: {
  mode: DashboardMode;
  active: boolean;
  onTrigger: () => void;
}) {
  return (
    <button
      onClick={onTrigger}
      title={`Simulate background signal: ${mode}`}
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition",
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800",
      )}
    >
      <Radio className="h-3 w-3" />
      {mode}
    </button>
  );
}
