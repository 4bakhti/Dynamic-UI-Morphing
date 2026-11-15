"use client";

import { motion } from "framer-motion";
import { BarChart2, FileText, Home, Settings, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavItem } from "@/lib/mock-data";

const ICONS: Record<NavItem["icon"], LucideIcon> = {
  home: Home,
  chart: BarChart2,
  report: FileText,
  users: Users,
  settings: Settings,
};

interface SidebarNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

export function SidebarNavigation({ activeTab, onTabChange, className }: SidebarNavigationProps) {
  return (
    <nav
      className={cn(
        "sticky top-0 flex h-screen w-64 flex-col gap-1 bg-ink p-4 text-sm text-slate-300",
        className,
      )}
    >
      <div className="mb-6 flex items-center gap-3 px-2 pt-1">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-500 shadow-glow">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" aria-hidden="true">
            <path
              d="M3 17c3-6 6-9 9-9s6 3 9 9"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path d="M7 17c1.6-2.8 3.2-4 5-4s3.4 1.2 5 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>
        <div className="leading-tight">
          <p className="font-semibold tracking-tight text-white">Aurora</p>
          <p className="text-[11px] text-slate-500">Adaptive Analytics</p>
        </div>
      </div>

      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>

      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive = item.label === activeTab;

        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onTabChange(item.label)}
            aria-current={isActive ? "page" : undefined}
            aria-pressed={isActive}
            data-telemetry-action={`navigate-${item.label.toLowerCase()}`}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium transition-colors",
              isActive ? "text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/[0.12] to-white/[0.04] ring-1 ring-inset ring-white/10"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon className={cn("relative h-[1.1em] w-[1.1em]", isActive && "text-indigo-300")} />
            <span className="relative">{item.label}</span>
          </button>
        );
      })}

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-400/10 to-transparent p-3.5">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            Privacy shield on
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
            Only timing, dwell and scroll numbers are measured. Zero keystrokes or page text are read.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[11px] font-semibold text-white ring-2 ring-white/10">
            QA
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-medium text-slate-200">Quarterly Analyst</p>
            <p className="text-[11px] text-slate-500">Finance · EMEA</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
