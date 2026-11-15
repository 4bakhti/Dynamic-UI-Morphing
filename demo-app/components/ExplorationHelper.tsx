"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";
import { requestInsight } from "@/lib/copilot";
import { useDashboardStore } from "@/lib/store";

const OFFLINE_NUDGE =
  "Looks like you've paused here a while — want me to draft an outline from your top metrics?";

/**
 * Gentle, dismissible helper anchored to the component the user is stuck on.
 * The nudge itself is written by Gemini from numeric telemetry + the
 * dashboard's aggregate data; one click drafts a full outline into the report.
 */
export function ExplorationHelper() {
  const [dismissed, setDismissed] = useState(false);
  const [nudge, setNudge] = useState<string | null>(null);
  const [source, setSource] = useState<"gemini" | "fallback" | null>(null);
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    requestInsight("nudge")
      .then((result) => {
        if (cancelled) return;
        setNudge(result.text);
        setSource(result.source);
      })
      .catch(() => {
        if (!cancelled) {
          setNudge(OFFLINE_NUDGE);
          setSource("fallback");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const draft = async () => {
    setDrafting(true);
    try {
      const result = await requestInsight("outline");
      const { reportText, setReportText } = useDashboardStore.getState();
      setReportText(`${reportText.trimEnd()}\n\n${result.text}`.trimStart());
      setDismissed(true);
    } finally {
      setDrafting(false);
    }
  };

  if (dismissed) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      className="absolute -top-6 right-6 z-20 w-80 animate-pulse-ring rounded-2xl border border-emerald-200/80 bg-white/95 p-4 shadow-xl shadow-emerald-900/5 backdrop-blur"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            {source === "gemini" ? "Gemini suggests" : "Copilot suggests"}
          </p>
          {nudge ? (
            <p className="mt-1 text-[13px] leading-snug text-slate-700">{nudge}</p>
          ) : (
            <div className="mt-2 space-y-1.5" aria-label="Loading suggestion">
              <div className="h-2.5 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-2.5 w-3/4 animate-pulse rounded bg-slate-100" />
            </div>
          )}
          <button
            type="button"
            onClick={draft}
            disabled={drafting || !nudge}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {drafting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {drafting ? "Drafting…" : "Draft outline for me"}
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss tip"
          className="shrink-0 text-slate-400 transition hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
