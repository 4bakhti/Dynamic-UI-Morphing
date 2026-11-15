"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Lock, LockOpen, RotateCcw, Sparkles, Upload, X } from "lucide-react";
import { useDashboardStore } from "@/lib/store";
import { DASHBOARD_MODES, type DashboardMode } from "@/lib/layoutConfig";
import type { LiveSignalState } from "@/lib/behaviourBridge";
import { MODE_THEME } from "@/lib/modeTheme";
import { useCopilotStore } from "@/lib/copilot";
import { ModeBadge } from "./ui/Badge";
import { Switch } from "./ui/Switch";
import { LiveSignalMeter } from "./LiveSignalMeter";
import { cn } from "@/lib/utils";

const IGNORED_BANNER_MS = 2600;

export function Header({ liveSignal, activeTab }: { liveSignal: LiveSignalState; activeTab: string }) {
  const currentMode = useDashboardStore((state) => state.currentMode);
  const isInterfaceLocked = useDashboardStore((state) => state.isInterfaceLocked);
  const lastIgnoredAttempt = useDashboardStore((state) => state.lastIgnoredAttempt);
  const importedLayoutConfig = useDashboardStore((state) => state.importedLayoutConfig);
  const setMode = useDashboardStore((state) => state.setMode);
  const toggleLock = useDashboardStore((state) => state.toggleLock);
  const clearIgnoredAttempt = useDashboardStore((state) => state.clearIgnoredAttempt);
  const resetLayoutConfig = useDashboardStore((state) => state.resetLayoutConfig);
  const importLayoutConfig = useDashboardStore((state) => state.importLayoutConfig);
  const layoutImportError = useDashboardStore((state) => state.layoutImportError);
  const copilotOpen = useCopilotStore((state) => state.open);
  const setCopilotOpen = useCopilotStore((state) => state.setOpen);

  const [showIgnoredBanner, setShowIgnoredBanner] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importJson, setImportJson] = useState("");

  const handleImport = () => {
    importLayoutConfig(importJson);
    // importLayoutConfig is synchronous — on success the error is cleared.
    if (!useDashboardStore.getState().layoutImportError) {
      setShowImportPanel(false);
      setImportJson("");
    }
  };

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
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-3 pt-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <span>Aurora</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-500">{activeTab}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Enterprise Data Analytics</h1>
            <ModeBadge mode={currentMode} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LiveSignalMeter liveSignal={liveSignal} />

          <button
            type="button"
            onClick={() => setCopilotOpen(!copilotOpen)}
            aria-expanded={copilotOpen}
            className={cn(
              "group relative flex items-center gap-2 overflow-hidden rounded-full px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow transition",
              "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:brightness-110",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Copilot
          </button>

          <div
            className={cn(
              "flex items-center gap-2 rounded-full border py-1 pl-2.5 pr-1 transition-colors",
              isInterfaceLocked ? "border-brand/30 bg-brand-soft" : "border-slate-200/80 bg-white/70",
            )}
          >
            {isInterfaceLocked ? (
              <Lock className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
            ) : (
              <LockOpen className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            )}
            <span className="text-xs font-medium text-slate-700">Lock Interface</span>
            <Switch checked={isInterfaceLocked} onCheckedChange={toggleLock} label="Lock interface" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-6 py-2">
        <span className="eyebrow">Simulate signal</span>
        <div
          className="relative flex items-center rounded-full bg-slate-100/80 p-1"
          title="Simulates the background cognitive-signal engine — respects the lock switch"
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

        <button
          onClick={() => setShowImportPanel((open) => !open)}
          title="Paste a layout JSON generated by the Developing Agent (vendor portal)"
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
            showImportPanel
              ? "border-brand/40 bg-brand-soft text-brand"
              : "border-slate-200 bg-white text-slate-600 hover:text-slate-900",
          )}
        >
          <Upload className="h-3 w-3" />
          Import layout
        </button>

        {importedLayoutConfig && (
          <button
            onClick={resetLayoutConfig}
            title="Using a layout imported from the Developing Agent — click to reset to default"
            className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
          >
            <RotateCcw className="h-3 w-3" />
            Custom layout active
          </button>
        )}

        <AnimatePresence>
          {showIgnoredBanner && lastIgnoredAttempt && (
            <motion.p
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200"
            >
              <Lock className="h-3 w-3" />
              Locked — ignored background signal: {lastIgnoredAttempt.mode} Mode
            </motion.p>
          )}
        </AnimatePresence>

        <span className="ml-auto hidden text-[11px] text-slate-400 lg:block">
          {MODE_THEME[currentMode].tagline}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {showImportPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-6 mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600">
                  Paste the layout JSON from the Developing Agent (FocusMode / ExplorationMode / ClarityMode)
                </p>
                <button
                  onClick={() => setShowImportPanel(false)}
                  aria-label="Close import panel"
                  className="text-slate-400 transition hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                spellCheck={false}
                placeholder='{"FocusMode": { ... }, "ExplorationMode": { ... }, "ClarityMode": { ... }}'
                className="mt-2 h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {layoutImportError && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{layoutImportError}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={handleImport}
                  disabled={!importJson.trim()}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Apply layout
                </button>
                <button
                  onClick={() => {
                    setShowImportPanel(false);
                    setImportJson("");
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
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
  const theme = MODE_THEME[mode];
  const Icon = theme.icon;

  return (
    <button
      onClick={onTrigger}
      title={`Simulate background signal: ${mode}`}
      aria-pressed={active}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active ? "text-slate-900" : "text-slate-500 hover:text-slate-800",
      )}
    >
      {active && (
        <motion.span
          layoutId="simulate-active"
          className="absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-slate-200/80"
          transition={{ type: "spring", stiffness: 500, damping: 36 }}
        />
      )}
      <Icon className="relative h-3 w-3" style={{ color: active ? theme.accent : undefined }} aria-hidden="true" />
      <span className="relative">{mode}</span>
    </button>
  );
}
