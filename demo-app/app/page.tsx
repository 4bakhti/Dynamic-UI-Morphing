"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2, Sparkles } from "lucide-react";
import { useDashboardStore } from "@/lib/store";
import {
  LAYOUT_CONFIG,
  getHelpTooltipTarget,
  getOverrideClasses,
  isComponentVisible,
  type DashboardMode,
} from "@/lib/layoutConfig";
import { Header } from "@/components/Header";
import { SidebarNavigation } from "@/components/SidebarNavigation";
import { TopMetricsRibbon } from "@/components/TopMetricsRibbon";
import { MainDataChart } from "@/components/MainDataChart";
import { ReportEditorTextarea } from "@/components/ReportEditorTextarea";
import { NotificationFeed } from "@/components/NotificationFeed";
import { ExplorationHelper } from "@/components/ExplorationHelper";
import { ScrollableAnalyticsContent } from "@/components/ScrollableAnalyticsContent";
import { ScrollableTabPlaceholder } from "@/components/ScrollableTabPlaceholder";
import { CopilotPanel } from "@/components/CopilotPanel";
import { ModeAura } from "@/components/ModeAura";
import { cn } from "@/lib/utils";
import { useBehaviourBridge } from "@/lib/behaviourBridge";
import { MODE_ANNOUNCEMENTS, speak, useCopilotStore } from "@/lib/copilot";

const morphTransition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

/** Speaks a short ElevenLabs announcement whenever the interface morphs (opt-in). */
function useModeAnnouncer(mode: DashboardMode) {
  const announce = useCopilotStore((state) => state.announceModes);
  const previous = useRef(mode);

  useEffect(() => {
    if (previous.current === mode) return;
    previous.current = mode;
    if (announce) void speak(MODE_ANNOUNCEMENTS[mode]);
  }, [mode, announce]);
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const currentMode = useDashboardStore((state) => state.currentMode);
  const importedLayoutConfig = useDashboardStore((state) => state.importedLayoutConfig);
  const setMode = useDashboardStore((state) => state.setMode);
  const hydrateLayoutConfig = useDashboardStore((state) => state.hydrateLayoutConfig);
  const setCopilotOpen = useCopilotStore((state) => state.setOpen);
  const liveSignal = useBehaviourBridge();
  useModeAnnouncer(currentMode);

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
      <main className="relative flex min-h-screen w-full items-center justify-center p-6">
        <ModeAura mode={currentMode} />
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCopilotOpen(true)}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 opacity-70 shadow-lg backdrop-blur-md transition hover:opacity-100"
          >
            <Sparkles className="h-4 w-4 text-violet-500" aria-hidden="true" />
            Copilot
          </button>
          <button
            type="button"
            onClick={() => setMode("Normal", "manual")}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/70 px-4 py-2 text-sm font-medium text-white opacity-70 shadow-lg backdrop-blur-md transition-all duration-200 hover:bg-violet-600 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            aria-label="Exit Focus Mode"
          >
            <Minimize2 className="h-4 w-4" aria-hidden="true" />
            Exit Focus Mode
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={morphTransition}
          className="mx-auto flex w-full max-w-4xl flex-col"
        >
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-violet-500/80">
            Focus mode · distractions hidden
          </p>
          <ReportEditorTextarea
            className={cn(
              getOverrideClasses("ReportEditorTextarea", currentMode, activeConfig),
              "mx-auto min-h-[calc(100vh-7rem)] w-full max-w-4xl text-[17px] shadow-2xl shadow-violet-900/10",
            )}
          />
        </motion.div>
        <CopilotPanel />
      </main>
    );
  }

  return (
    <div className="relative flex min-h-screen">
      <ModeAura mode={currentMode} />

      <AnimatePresence initial={false}>
        {showSidebar && (
          <motion.div
            key="sidebar"
            layout
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={morphTransition}
            className="sticky top-0 h-screen shrink-0 overflow-hidden"
          >
            <SidebarNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              className={getOverrideClasses("SidebarNavigation", currentMode, activeConfig)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout transition={morphTransition} className="flex min-w-0 flex-1 flex-col">
        <Header liveSignal={liveSignal} activeTab={activeTab} />

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
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={morphTransition}
                      className="lg:flex-[2]"
                    >
                      <MainDataChart className={getOverrideClasses("MainDataChart", currentMode, activeConfig)} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div layout transition={morphTransition} className="relative flex flex-1 lg:flex-[2]">
                  <ReportEditorTextarea
                    className={getOverrideClasses("ReportEditorTextarea", currentMode, activeConfig)}
                  />
                  <AnimatePresence>{showHelper && <ExplorationHelper />}</AnimatePresence>
                </motion.div>

                <AnimatePresence initial={false}>
                  {showFeed && (
                    <motion.div
                      key="feed"
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={morphTransition}
                      className="lg:flex-[1]"
                    >
                      <NotificationFeed className={getOverrideClasses("NotificationFeed", currentMode, activeConfig)} />
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

      <CopilotPanel />
    </div>
  );
}
