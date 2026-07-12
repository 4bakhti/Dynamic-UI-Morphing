"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2 } from "lucide-react";
import { useDashboardStore } from "@/lib/store";
import { LAYOUT_CONFIG, getHelpTooltipTarget, getOverrideClasses, isComponentVisible } from "@/lib/layoutConfig";
import { Header } from "@/components/Header";
import { SidebarNavigation } from "@/components/SidebarNavigation";
import { TopMetricsRibbon } from "@/components/TopMetricsRibbon";
import { MainDataChart } from "@/components/MainDataChart";
import { ReportEditorTextarea } from "@/components/ReportEditorTextarea";
import { NotificationFeed } from "@/components/NotificationFeed";
import { ExplorationHelper } from "@/components/ExplorationHelper";
import { ScrollableAnalyticsContent } from "@/components/ScrollableAnalyticsContent";
import { ScrollableTabPlaceholder } from "@/components/ScrollableTabPlaceholder";
import { cn } from "@/lib/utils";
import { useBehaviourBridge } from "@/lib/behaviourBridge";

const morphTransition = { duration: 0.25, ease: "easeInOut" as const };

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const currentMode = useDashboardStore((state) => state.currentMode);
  const importedLayoutConfig = useDashboardStore((state) => state.importedLayoutConfig);
  const setMode = useDashboardStore((state) => state.setMode);
  const hydrateLayoutConfig = useDashboardStore((state) => state.hydrateLayoutConfig);
  const liveSignal = useBehaviourBridge();

  // Re-apply a layout imported in a previous session. Runs after mount so it
  // never causes an SSR/hydration mismatch (localStorage is client-only).
  useEffect(() => {
    hydrateLayoutConfig();
  }, [hydrateLayoutConfig]);

  const activeConfig = importedLayoutConfig ?? LAYOUT_CONFIG;

  const showSidebar = isComponentVisible("SidebarNavigation", currentMode, activeConfig);
  const showRibbon = isComponentVisible("TopMetricsRibbon", currentMode, activeConfig);
  const showChart = isComponentVisible("MainDataChart", currentMode, activeConfig);
  const showFeed = isComponentVisible("NotificationFeed", currentMode, activeConfig);
  const showHelper = getHelpTooltipTarget(currentMode, activeConfig) === "ReportEditorTextarea";
  const isFocusMode = currentMode === "Focus";
  const isExplorationMode = currentMode === "Exploration";

  if (isFocusMode) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-6">
        <button
          type="button"
          onClick={() => setMode("Normal", "manual")}
          className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/60 px-4 py-2 text-sm font-medium text-white opacity-60 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-indigo-400/40 hover:bg-indigo-600 hover:opacity-100 hover:shadow-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          aria-label="Exit Focus Mode"
        >
          <Minimize2 className="h-4 w-4" aria-hidden="true" />
          Exit Focus Mode
        </button>

        <ReportEditorTextarea
          className={cn(
            getOverrideClasses("ReportEditorTextarea", currentMode, activeConfig),
            "mx-auto min-h-[calc(100vh-3rem)] w-full max-w-5xl shadow-none",
          )}
        />
      </main>
    );
  }

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
            <SidebarNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              className={getOverrideClasses("SidebarNavigation", currentMode, activeConfig)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout transition={morphTransition} className="flex flex-1 flex-col">
        <Header liveSignal={liveSignal} />

        <main className="flex flex-1 flex-col gap-6 p-6">
          {activeTab === "Overview" ? (
            <>
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
                <TopMetricsRibbon className={getOverrideClasses("TopMetricsRibbon", currentMode, activeConfig)} />
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
                  <MainDataChart
                    className={getOverrideClasses("MainDataChart", currentMode, activeConfig)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              layout
              transition={morphTransition}
              className="relative flex flex-1 lg:flex-[2]"
            >
              <ReportEditorTextarea className={getOverrideClasses("ReportEditorTextarea", currentMode, activeConfig)} />
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
                  <NotificationFeed
                    className={getOverrideClasses("NotificationFeed", currentMode, activeConfig)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <ScrollableAnalyticsContent dimmed={isExplorationMode} />
            </>
          ) : (
            <ScrollableTabPlaceholder tab={activeTab} />
          )}
        </main>
      </motion.div>
    </div>
  );
}
