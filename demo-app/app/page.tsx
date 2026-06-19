"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useDashboardStore } from "@/lib/store";
import { getHelpTooltipTarget, getOverrideClasses, isComponentVisible } from "@/lib/layoutConfig";
import { Header } from "@/components/Header";
import { SidebarNavigation } from "@/components/SidebarNavigation";
import { TopMetricsRibbon } from "@/components/TopMetricsRibbon";
import { MainDataChart } from "@/components/MainDataChart";
import { ReportEditorTextarea } from "@/components/ReportEditorTextarea";
import { NotificationFeed } from "@/components/NotificationFeed";
import { ExplorationHelper } from "@/components/ExplorationHelper";
import { cn } from "@/lib/utils";

const morphTransition = { duration: 0.25, ease: "easeInOut" as const };

export default function DashboardPage() {
  const currentMode = useDashboardStore((state) => state.currentMode);

  const showSidebar = isComponentVisible("SidebarNavigation", currentMode);
  const showRibbon = isComponentVisible("TopMetricsRibbon", currentMode);
  const showChart = isComponentVisible("MainDataChart", currentMode);
  const showFeed = isComponentVisible("NotificationFeed", currentMode);
  const showHelper = getHelpTooltipTarget(currentMode) === "ReportEditorTextarea";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AnimatePresence initial={false}>
        {showSidebar && (
          <motion.div
            key="sidebar"
            layout
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={morphTransition}
            className="overflow-hidden"
          >
            <SidebarNavigation className={getOverrideClasses("SidebarNavigation", currentMode)} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout transition={morphTransition} className="flex flex-1 flex-col">
        <Header />

        <main className="flex flex-1 flex-col gap-6 p-6">
          <AnimatePresence initial={false}>
            {showRibbon && (
              <motion.div
                key="ribbon"
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={morphTransition}
              >
                <TopMetricsRibbon className={getOverrideClasses("TopMetricsRibbon", currentMode)} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout transition={morphTransition} className="flex flex-1 flex-col gap-6 lg:flex-row">
            <AnimatePresence initial={false}>
              {showChart && (
                <motion.div
                  key="chart"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={morphTransition}
                  className="lg:flex-[2]"
                >
                  <MainDataChart />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              layout
              transition={morphTransition}
              className={cn("relative flex flex-1", currentMode === "Focus" ? "lg:flex-[1]" : "lg:flex-[2]")}
            >
              <ReportEditorTextarea className={getOverrideClasses("ReportEditorTextarea", currentMode)} />
              <AnimatePresence>{showHelper && <ExplorationHelper />}</AnimatePresence>
            </motion.div>

            <AnimatePresence initial={false}>
              {showFeed && (
                <motion.div
                  key="feed"
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={morphTransition}
                  className="lg:flex-[1]"
                >
                  <NotificationFeed />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
