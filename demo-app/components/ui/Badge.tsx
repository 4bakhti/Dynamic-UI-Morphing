"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DashboardMode } from "@/lib/layoutConfig";
import { MODE_THEME } from "@/lib/modeTheme";

export function ModeBadge({ mode }: { mode: DashboardMode }) {
  const theme = MODE_THEME[mode];
  const Icon = theme.icon;

  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-colors duration-500",
        theme.badge,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="inline-flex items-center gap-1"
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
          {mode} Mode
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Small "Live" / "Fallback" pill used to keep sponsor-integration status honest. */
export function StatusPill({ live, liveLabel = "Live", offLabel = "Offline fallback" }: {
  live: boolean | null;
  liveLabel?: string;
  offLabel?: string;
}) {
  if (live === null) {
    return <span className="chip bg-slate-100 text-[10px] text-slate-500">Checking…</span>;
  }
  return (
    <span
      className={cn(
        "chip text-[10px] font-semibold",
        live ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-emerald-500" : "bg-amber-500")} />
      {live ? liveLabel : offLabel}
    </span>
  );
}
