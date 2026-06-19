"use client";

import { Bold, Italic, List } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportEditorTextarea({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2 text-slate-400">
        <Bold className="h-4 w-4" />
        <Italic className="h-4 w-4" />
        <List className="h-4 w-4" />
        <span className="ml-auto text-xs font-medium text-slate-500">Quarterly Report Draft</span>
      </div>
      <textarea
        defaultValue="Q3 performance exceeded targets across all regions. Revenue grew 12% quarter-over-quarter, driven primarily by..."
        placeholder="Start writing your report..."
        className="min-h-[220px] flex-1 resize-none border-0 p-4 text-slate-800 outline-none placeholder:text-slate-400"
      />
      <div className="border-t border-slate-200 px-4 py-2 text-xs text-slate-400">
        Autosaved · 42 words
      </div>
    </div>
  );
}
