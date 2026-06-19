import { cn } from "@/lib/utils";
import type { DashboardMode } from "@/lib/layoutConfig";

const MODE_BADGE_CLASSES: Record<DashboardMode, string> = {
  Normal: "bg-slate-100 text-slate-700 ring-slate-200",
  Focus: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Exploration: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Clarity: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
};

export function ModeBadge({ mode }: { mode: DashboardMode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1",
        MODE_BADGE_CLASSES[mode],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {mode} Mode
    </span>
  );
}
