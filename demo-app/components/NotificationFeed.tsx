"use client";

import { AlertTriangle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOTIFICATIONS, type Notification } from "@/lib/mock-data";

const TONE: Record<Notification["tone"], { Icon: LucideIcon; className: string }> = {
  info: { Icon: Info, className: "text-sky-500" },
  warning: { Icon: AlertTriangle, className: "text-amber-500" },
  success: { Icon: CheckCircle2, className: "text-emerald-500" },
};

export function NotificationFeed({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
      <ul className="mt-3 space-y-3">
        {NOTIFICATIONS.map((notification) => {
          const { Icon, className: iconClass } = TONE[notification.tone];
          return (
            <li key={notification.id} className="flex items-start gap-3">
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
              <div>
                <p className="text-sm text-slate-700">{notification.title}</p>
                <p className="text-xs text-slate-400">{notification.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
