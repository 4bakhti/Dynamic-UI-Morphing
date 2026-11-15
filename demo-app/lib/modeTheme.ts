import { Eye, Focus, LayoutDashboard, Sparkles, type LucideIcon } from "lucide-react";
import type { DashboardMode } from "./layoutConfig";

export interface ModeTheme {
  label: string;
  tagline: string;
  icon: LucideIcon;
  /** Solid accent used for dots, meters and the active pill. */
  accent: string;
  badge: string;
  /** Two ambient glow colours painted behind the dashboard. */
  aura: [string, string];
}

export const MODE_THEME: Record<DashboardMode, ModeTheme> = {
  Normal: {
    label: "Normal",
    tagline: "Steady rhythm — full workspace",
    icon: LayoutDashboard,
    accent: "#5b5bf6",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-200/80",
    aura: ["rgba(99, 102, 241, 0.16)", "rgba(168, 85, 247, 0.10)"],
  },
  Focus: {
    label: "Focus",
    tagline: "Attention dropping — clutter removed",
    icon: Focus,
    accent: "#7c3aed",
    badge: "bg-violet-50 text-violet-700 ring-violet-200/80",
    aura: ["rgba(124, 58, 237, 0.16)", "rgba(99, 102, 241, 0.10)"],
  },
  Exploration: {
    label: "Exploration",
    tagline: "Looks stuck — guidance surfaced",
    icon: Sparkles,
    accent: "#059669",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
    aura: ["rgba(16, 185, 129, 0.16)", "rgba(20, 184, 166, 0.10)"],
  },
  Clarity: {
    label: "Clarity",
    tagline: "Strain detected — everything simplified",
    icon: Eye,
    accent: "#0284c7",
    badge: "bg-sky-50 text-sky-700 ring-sky-200/80",
    aura: ["rgba(14, 165, 233, 0.16)", "rgba(56, 189, 248, 0.10)"],
  },
};
