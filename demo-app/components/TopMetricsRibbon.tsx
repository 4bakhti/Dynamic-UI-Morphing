"use client";

import { ArrowDownRight, ArrowUpRight, DollarSign, Percent, UserMinus, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { METRICS } from "@/lib/mock-data";

const DECOR: Record<string, { Icon: LucideIcon; gradient: string; stroke: string; spark: number[] }> = {
  Revenue: {
    Icon: DollarSign,
    gradient: "from-indigo-500 to-violet-500",
    stroke: "#6366f1",
    spark: [32, 41, 38, 52, 49, 62, 58, 70],
  },
  "Active Users": {
    Icon: Users,
    gradient: "from-sky-500 to-cyan-400",
    stroke: "#0ea5e9",
    spark: [40, 44, 43, 47, 50, 49, 53, 55],
  },
  "Conversion Rate": {
    Icon: Percent,
    gradient: "from-amber-500 to-orange-400",
    stroke: "#f59e0b",
    spark: [52, 50, 54, 49, 47, 48, 45, 44],
  },
  Churn: {
    Icon: UserMinus,
    gradient: "from-emerald-500 to-teal-400",
    stroke: "#10b981",
    spark: [60, 58, 57, 55, 53, 52, 50, 48],
  },
};

function sparkPath(points: number[], width = 96, height = 32): string {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  return points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - 3 - ((value - min) / range) * (height - 6);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function TopMetricsRibbon({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {METRICS.map((metric) => {
        // For churn, a falling number is good news.
        const goodWhenDown = metric.label === "Churn";
        const positive = goodWhenDown ? metric.delta <= 0 : metric.delta >= 0;
        const decor = DECOR[metric.label] ?? DECOR.Revenue;
        const { Icon } = decor;
        const path = sparkPath(decor.spark);

        return (
          <div key={metric.label} className="card group p-4 hover:shadow-card-hover">
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                  decor.gradient,
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <span
                className={cn(
                  "chip gap-0.5 px-2 py-0.5 text-[11px] font-semibold",
                  positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                )}
              >
                {metric.delta >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(metric.delta)}%
              </span>
            </div>

            <p className="mt-4 text-[12px] font-medium text-slate-500">{metric.label}</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <span className="text-[1.6em] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
                {metric.value}
              </span>
              <svg viewBox="0 0 96 32" className="h-8 w-24 shrink-0" aria-hidden="true">
                <defs>
                  <linearGradient id={`spark-${metric.label.replace(/\s/g, "")}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={decor.stroke} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={decor.stroke} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${path} L96,32 L0,32 Z`} fill={`url(#spark-${metric.label.replace(/\s/g, "")})`} />
                <path d={path} fill="none" stroke={decor.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
