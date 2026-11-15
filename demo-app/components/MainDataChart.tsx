"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { CHART_LABELS, CHART_SERIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const WIDTH = 640;
const HEIGHT = 240;
const PAD_X = 28;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const MAX_VALUE = 80;
const GRID_VALUES = [0, 20, 40, 60, 80];

function coords(points: number[]) {
  const stepX = (WIDTH - PAD_X * 2) / (points.length - 1);
  return points.map((value, index) => ({
    x: PAD_X + index * stepX,
    y: HEIGHT - PAD_BOTTOM - (value / MAX_VALUE) * (HEIGHT - PAD_TOP - PAD_BOTTOM),
    value,
  }));
}

/** Catmull-Rom → cubic Bézier for a smooth line through every point. */
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  return pts.reduce((acc, p, i, arr) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const p0 = arr[i - 2] ?? arr[i - 1];
    const p1 = arr[i - 1];
    const p2 = p;
    const p3 = arr[i + 1] ?? p;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    return `${acc} C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }, "");
}

export function MainDataChart({ className }: { className?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [revenue, target] = CHART_SERIES;
  const revenuePts = coords(revenue.points);
  const targetPts = coords(target.points);
  const revenueLine = smoothPath(revenuePts);
  const baseline = HEIGHT - PAD_BOTTOM;
  const area = `${revenueLine} L${revenuePts.at(-1)!.x},${baseline} L${revenuePts[0].x},${baseline} Z`;
  const last = revenue.points.at(-1)!;
  const first = revenue.points[0];
  const growth = (((last - first) / first) * 100).toFixed(0);

  return (
    <div className={cn("card flex h-full flex-col p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Revenue vs. target</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">${last}k</span>
            <span className="chip gap-1 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <TrendingUp className="h-3 w-3" /> +{growth}% YTD
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {CHART_SERIES.map((series) => (
            <span key={series.name} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className={cn("h-2 w-2 rounded-full", series.name === "Target" && "ring-2 ring-slate-200")}
                style={{ backgroundColor: series.color }}
              />
              {series.name}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-4 flex-1">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-full w-full overflow-visible"
          role="img"
          aria-label="Revenue versus target line chart"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={revenue.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={revenue.color} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="revenue-stroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>

          {GRID_VALUES.map((value) => {
            const y = HEIGHT - PAD_BOTTOM - (value / MAX_VALUE) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
            return (
              <g key={value}>
                <line x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} stroke="#eef0f4" strokeWidth={1} />
                <text x={PAD_X - 8} y={y + 3} textAnchor="end" className="fill-slate-400 text-[12px]">
                  {value}
                </text>
              </g>
            );
          })}

          <path d={area} fill="url(#revenue-fill)" />
          <path
            d={smoothPath(targetPts)}
            fill="none"
            stroke={target.color}
            strokeWidth={2}
            strokeDasharray="5 5"
            strokeLinecap="round"
          />
          <path d={revenueLine} fill="none" stroke="url(#revenue-stroke)" strokeWidth={3} strokeLinecap="round" />

          {revenuePts.map((p, i) => (
            <g key={i}>
              <rect
                x={p.x - (WIDTH - PAD_X * 2) / (revenuePts.length - 1) / 2}
                y={PAD_TOP}
                width={(WIDTH - PAD_X * 2) / (revenuePts.length - 1)}
                height={HEIGHT - PAD_TOP - PAD_BOTTOM}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              {hover === i && (
                <line x1={p.x} x2={p.x} y1={PAD_TOP} y2={baseline} stroke="#c7d2fe" strokeDasharray="3 3" />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={hover === i ? 5.5 : i === revenuePts.length - 1 ? 4.5 : 0}
                fill="white"
                stroke="#6d28d9"
                strokeWidth={2.5}
                className="transition-all duration-150"
              />
            </g>
          ))}

          {CHART_LABELS.map((label, i) => (
            <text
              key={label}
              x={revenuePts[i].x}
              y={HEIGHT - 8}
              textAnchor="middle"
              className={cn("text-[12px]", hover === i ? "fill-slate-700 font-semibold" : "fill-slate-400")}
            >
              {label}
            </text>
          ))}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-2 text-[11px] text-white shadow-lg"
            style={{
              left: `${(revenuePts[hover].x / WIDTH) * 100}%`,
              top: `${(Math.min(revenuePts[hover].y, targetPts[hover].y) / HEIGHT) * 100}%`,
              marginTop: -10,
            }}
          >
            <p className="font-semibold">{CHART_LABELS[hover]}</p>
            <p className="mt-0.5 text-indigo-200">Revenue ${revenue.points[hover]}k</p>
            <p className="text-slate-400">Target ${target.points[hover]}k</p>
          </div>
        )}
      </div>
    </div>
  );
}
