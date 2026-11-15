"use client";

import { motion } from "framer-motion";
import type { DashboardMode } from "@/lib/layoutConfig";
import { MODE_THEME } from "@/lib/modeTheme";

/** Soft ambient glow behind the dashboard whose colour morphs with the mode. */
export function ModeAura({ mode }: { mode: DashboardMode }) {
  const [primary, secondary] = MODE_THEME[mode].aura;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-40 left-1/4 h-[520px] w-[720px] rounded-full blur-3xl"
        animate={{ backgroundColor: primary }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-40 top-1/3 h-[480px] w-[560px] rounded-full blur-3xl"
        animate={{ backgroundColor: secondary }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.07) 1px, transparent 0)",
          backgroundSize: "22px 22px",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 65%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 65%)",
        }}
      />
    </div>
  );
}
