"use client";

import { useEffect, useState } from "react";
import { Lock, LockOpen, Radio } from "lucide-react";
import { useDashboardStore } from "@/lib/store";
import { DASHBOARD_MODES, type DashboardMode } from "@/lib/layoutConfig";
import { ModeBadge } from "./ui/Badge";
import { Switch } from "./ui/Switch";
import { cn } from "@/lib/utils";

const IGNORED_BANNER_MS = 2600;

export function Header() {
  const currentMode = useDashboardStore((state) => state.currentMode);
  const isInterfaceLocked = useDashboardStore((state) => state.isInterfaceLocked);
  const lastIgnoredAttempt = useDashboardStore((state) => state.lastIgnoredAttempt);
  const setMode = useDashboardStore((state) => state.setMode);
  const toggleLock = useDashboardStore((state) => state.toggleLock);
  const clearIgnoredAttempt = useDashboardStore((state) => state.clearIgnoredAttempt);

  const [showIgnoredBanner, setShowIgnoredBanner] = useState(false);

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
