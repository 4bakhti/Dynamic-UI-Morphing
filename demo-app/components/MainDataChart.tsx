"use client";

import { CHART_LABELS, CHART_SERIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = 24;
const MAX_VALUE = 80;

function toPoints(points: number[]): string {
  const stepX = (WIDTH - PADDING * 2) / (points.length - 1);
  return points
    .map((value, index) => {
      const x = PADDING + index * stepX;
      const y = HEIGHT - PADDING - (value / MAX_VALUE) * (HEIGHT - PADDING * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export function MainDataChart({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Revenue vs. Target</h3>
        <div className="flex items-center gap-4">
          {CHART_SERIES.map((series) => (
            <span key={series.name} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: series.color }} />
              {series.name}
            </span>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-4 w-full"
        role="img"
        aria-label="Revenue versus target line chart"
      >
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={PADDING}
            x2={WIDTH - PADDING}
            y1={PADDING + fraction * (HEIGHT - PADDING * 2)}
            y2={PADDING + fraction * (HEIGHT - PADDING * 2)}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
        ))}
        {CHART_SERIES.map((series) => (
          <polyline
            key={series.name}
            points={toPoints(series.points)}
            fill="none"
            stroke={series.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      <div className="mt-2 flex justify-between text-[11px] text-slate-400">
        {CHART_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
