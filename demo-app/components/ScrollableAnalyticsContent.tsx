"use client";

import { ArrowUpRight, Database, TableProperties } from "lucide-react";
import { cn } from "@/lib/utils";

const REGIONAL_ROWS = Array.from({ length: 18 }, (_, index) => ({
  region: ["North America", "EMEA", "APAC", "Latin America"][index % 4],
  segment: ["Enterprise", "Mid-market", "Digital", "Strategic"][index % 4],
  pipeline: `$${(1.4 + index * 0.23).toFixed(2)}M`,
  confidence: `${72 + (index % 7) * 3}%`,
  change: `+${(2.1 + (index % 5) * 0.8).toFixed(1)}%`,
}));

const BAR_HEIGHTS = [44, 62, 53, 78, 68, 86, 72, 91, 77, 96, 83, 100];

export function ScrollableAnalyticsContent({ dimmed }: { dimmed: boolean }) {
  return (
    <section
      aria-label="Extended analytics content"
      className={cn("space-y-6 transition-opacity duration-300", dimmed && "opacity-30")}
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Forecast</p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">Monthly pipeline velocity</h2>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <ArrowUpRight className="h-4 w-4" /> 8.4%
            </span>
          </div>
          <div className="mt-8 flex h-56 items-end gap-3 border-b border-slate-200 px-2">
            {BAR_HEIGHTS.map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="w-full rounded-t bg-indigo-400/80 transition-colors hover:bg-indigo-500"
                  style={{ height: `${height}%` }}
                  title={`Month ${index + 1}: ${height} units`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            <span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Dec</span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-slate-900">Data quality monitor</h2>
          </div>
          <div className="mt-5 space-y-5">
            {["CRM accounts", "Billing events", "Product usage", "Support activity", "Marketing attribution"].map(
              (source, index) => {
                const completeness = 96 - index * 3;
                return (
                  <div key={source}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{source}</span>
                      <span className="text-slate-500">{completeness}% complete</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${completeness}%` }} />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </article>
      </div>

      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <TableProperties className="h-4 w-4 text-indigo-500" />
          <h2 className="text-base font-semibold text-slate-900">Regional performance detail</h2>
          <span className="ml-auto text-xs text-slate-400">18 active segments</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Region</th>
                <th className="px-5 py-3 font-medium">Segment</th>
                <th className="px-5 py-3 font-medium">Pipeline</th>
                <th className="px-5 py-3 font-medium">Confidence</th>
                <th className="px-5 py-3 font-medium">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {REGIONAL_ROWS.map((row, index) => (
                <tr key={`${row.region}-${row.segment}-${index}`} className="hover:bg-slate-50/80">
                  <td className="px-5 py-4 font-medium text-slate-800">{row.region}</td>
                  <td className="px-5 py-4 text-slate-600">{row.segment}</td>
                  <td className="px-5 py-4 text-slate-600">{row.pipeline}</td>
                  <td className="px-5 py-4 text-slate-600">{row.confidence}</td>
                  <td className="px-5 py-4 font-medium text-emerald-600">{row.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
