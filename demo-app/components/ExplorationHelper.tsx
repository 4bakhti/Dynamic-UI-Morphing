"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

/** Gentle, dismissible AI helper anchored to the component the user is stuck on. */
export function ExplorationHelper() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute -top-20 right-6 z-10 w-72 animate-pulse-ring rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-lg"
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-sm text-emerald-800">
          Looks like you&apos;ve paused here a while — want me to draft an outline from your top
          3 metrics?
        </p>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss tip"
          className="shrink-0 text-emerald-500 transition hover:text-emerald-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
