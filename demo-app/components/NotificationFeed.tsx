"use client";

import { AlertTriangle, Bell, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOTIFICATIONS, type Notification } from "@/lib/mock-data";

const TONE: Record<Notification["tone"], { Icon: LucideIcon; className: string }> = {
  info: { Icon: Info, className: "bg-sky-50 text-sky-600 ring-sky-100" },
  warning: { Icon: AlertTriangle, className: "bg-amber-50 text-amber-600 ring-amber-100" },
  success: { Icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
};

export function NotificationFeed({ className }: { className?: string }) {
  return (
    <div className={cn("card h-full p-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="card-title flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-slate-400" />
          Notifications
        </h3>
        <span className="chip bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
          {NOTIFICATIONS.length} new
        </span>
      </div>
      <ul className="relative mt-4 space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-slate-100">
        {NOTIFICATIONS.map((notification) => {
          const { Icon, className: toneClass } = TONE[notification.tone];
          return (
            <li key={notification.id} className="relative flex items-start gap-3">
              <span
                className={cn(
                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
                  toneClass,
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="pt-0.5">
                <p className="text-[13px] font-medium leading-snug text-slate-700">{notification.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{notification.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
