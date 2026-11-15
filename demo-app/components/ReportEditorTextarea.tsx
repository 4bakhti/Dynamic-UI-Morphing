"use client";

import { useState } from "react";
import { Bold, Italic, List, Loader2, Sparkles, Square, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/lib/store";
import { requestInsight, speak, stopSpeaking, useCopilotStore } from "@/lib/copilot";

export function ReportEditorTextarea({ className, compact = false }: { className?: string; compact?: boolean }) {
  const reportText = useDashboardStore((state) => state.reportText);
  const setReportText = useDashboardStore((state) => state.setReportText);
  const speaking = useCopilotStore((state) => state.speaking);
  const lastVoiceSource = useCopilotStore((state) => state.lastVoiceSource);
  const [drafting, setDrafting] = useState(false);
  const [draftSource, setDraftSource] = useState<"gemini" | "fallback" | null>(null);

  const words = reportText.trim() ? reportText.trim().split(/\s+/).length : 0;

  const draftOutline = async () => {
    setDrafting(true);
    try {
      const result = await requestInsight("outline");
      setReportText(`${reportText.trimEnd()}\n\n${result.text}`.trimStart());
      setDraftSource(result.source);
    } catch {
      setDraftSource("fallback");
    } finally {
      setDrafting(false);
    }
  };

  const toggleReadAloud = () => {
    if (speaking) {
      stopSpeaking();
    } else if (reportText.trim()) {
      // Explicit, user-initiated: only now does the draft leave the browser.
      void speak(reportText);
    }
  };

  return (
    <div className={cn("card flex flex-1 flex-col overflow-hidden", className)}>
      <div className="flex items-center gap-1 border-b border-slate-100 px-3 py-2 text-slate-400">
        <div className="hidden items-center gap-1 2xl:flex">
          {[Bold, Italic, List].map((Icon, i) => (
            <span key={i} className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-slate-100 hover:text-slate-700">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          ))}
          <span className="mx-2 h-4 w-px bg-slate-200" />
        </div>
        <span className="min-w-0 truncate pl-1 text-[12px] font-semibold text-slate-600">Quarterly Report</span>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <button
            type="button"
            onClick={toggleReadAloud}
            title="Read the draft aloud with ElevenLabs"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition",
              speaking ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {speaking ? (
              <>
                <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
                  {[0, 1, 2].map((bar) => (
                    <span
                      key={bar}
                      className="w-[3px] origin-bottom animate-equalize rounded-full bg-white"
                      style={{ height: "100%", animationDelay: `${bar * 0.15}s` }}
                    />
                  ))}
                </span>
                <Square className="h-3 w-3" aria-hidden="true" /> Stop
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> {compact ? "" : "Read aloud"}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={draftOutline}
            disabled={drafting}
            title="Draft an outline from the dashboard's metrics with Gemini"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-70"
          >
            {drafting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {drafting ? "Drafting…" : "Draft with Gemini"}
          </button>
        </div>
      </div>

      <textarea
        value={reportText}
        onChange={(e) => setReportText(e.target.value)}
        placeholder="Start writing your report..."
        aria-label="Quarterly report draft"
        className="min-h-[240px] flex-1 resize-none border-0 bg-transparent p-5 leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
      />

      <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Autosaved
        </span>
        <span>·</span>
        <span className="tabular-nums">{words} words</span>
        {draftSource && (
          <span className="ml-auto">
            Outline by {draftSource === "gemini" ? "Gemini" : "offline template (add GEMINI_API_KEY)"}
          </span>
        )}
        {!draftSource && lastVoiceSource && (
          <span className="ml-auto">
            Voice: {lastVoiceSource === "elevenlabs" ? "ElevenLabs" : "browser fallback (add ELEVENLABS_API_KEY)"}
          </span>
        )}
      </div>
    </div>
  );
}
