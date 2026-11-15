"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import type { LiveSignalState } from "@/lib/behaviourBridge";

/**
 * The real BehaviourEngine's composite score (−3 … +3) as a compact meter —
 * separate from the Simulate pills, so judges can watch genuine telemetry.
 */
export function LiveSignalMeter({ liveSignal }: { liveSignal: LiveSignalState }) {
  const score = Math.max(-3, Math.min(3, liveSignal.compositeScore));
  const position = ((score + 3) / 6) * 100;

  return (
    <div
      className="hidden items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/70 py-1 pl-2.5 pr-3 md:flex"
      title="Live composite score from the real BehaviourEngine running on this page (numeric telemetry only)"
    >
      <Activity className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
      <div className="relative h-1.5 w-24 rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-400">
        <motion.span
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow"
          animate={{ left: `${liveSignal.ready ? position : 50}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>
      {liveSignal.ready ? (
        <span className="font-mono text-[11px] tabular-nums text-slate-600">
          {score >= 0 ? "+" : ""}
          {score.toFixed(2)}
          <span className="ml-1 text-slate-400">· {liveSignal.activeSignals} sig</span>
        </span>
      ) : (
        <span className="shimmer-text text-[11px] font-medium">calibrating…</span>
      )}
    </div>
  );
}
