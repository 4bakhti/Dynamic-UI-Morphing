"use client";

import { BarChart2, FileText, Home, Settings, Users, type LucideIcon } from "lucide-react";
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
        "flex h-full w-60 flex-col gap-1 border-r border-slate-200 bg-white p-4",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
          A
        </div>
        <span className="text-sm font-semibold text-slate-900">Aurora Analytics</span>
      </div>

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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-soft text-brand"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
