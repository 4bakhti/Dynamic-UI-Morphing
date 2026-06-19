"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: () => void;
  label: string;
}

export function Switch({ checked, onCheckedChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onCheckedChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-brand" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-[22px]",
        )}
      />
    </button>
  );
}
