"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { METRICS } from "@/lib/mock-data";

export function TopMetricsRibbon({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {METRICS.map((metric) => {
        const positive = metric.delta >= 0;
        return (
          <div
            key={metric.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {metric.label}
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-slate-900">{metric.value}</span>
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs font-semibold",
                  positive ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {positive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {Math.abs(metric.delta)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
