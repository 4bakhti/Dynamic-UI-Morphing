"use client";

import { useEffect, useRef, useState } from "react";
import {
  BehaviourEngine,
  useBehaviourStore,
  type BehaviourMode,
} from "../../src/behaviour";
import { useDashboardStore } from "./store";
import type { DashboardMode } from "./layoutConfig";

const MODE_MAP: Record<BehaviourMode, DashboardMode> = {
  standard: "Normal",
  clarity: "Clarity",
  focus: "Focus",
  exploration: "Exploration",
};

/**
 * Faster-than-spec thresholds so live telemetry can visibly trigger a mode
 * change within a short demo session. Production defaults in
 * src/behaviour/config/behaviourConfig.ts are untouched; this only affects
 * the engine instance running inside demo-app.
 */
const DEMO_ENGINE_CONFIG = {
  baselineMinimumSamples: 8,
  rollingWindowMs: 20_000,
  scoringIntervalMs: 4_000,
  transitionCooldownMs: 8_000,
  hysteresisReturnToStandardMs: 6_000,
};

export interface LiveSignalState {
  compositeScore: number;
  activeSignals: number;
  ready: boolean;
}

/**
 * Starts the real BehaviourEngine against this page's own DOM events and
 * mirrors its mode into the dashboard's Zustand store as a "system" source,
 * so it respects the Lock Interface toggle exactly like the simulate pills.
 */
export function useBehaviourBridge(): LiveSignalState {
  const engineRef = useRef<BehaviourEngine | null>(null);
  const setMode = useDashboardStore((state) => state.setMode);
  const [signal, setSignal] = useState<LiveSignalState>({
    compositeScore: 0,
    activeSignals: 0,
    ready: false,
  });

  useEffect(() => {
    const engine = new BehaviourEngine({ config: DEMO_ENGINE_CONFIG });
    engineRef.current = engine;
    engine.start();

    let lastSeenMode: BehaviourMode = useBehaviourStore.getState().mode;

    const unsubscribe = useBehaviourStore.subscribe((state) => {
      // Only dispatch on an actual engine transition — compositeScore and
      // activeZScores update every tick even when the mode hasn't changed,
      // and re-asserting an unchanged mode would stomp a manual "Simulate"
      // click or an imported-layout test that happened in between ticks.
      if (state.mode !== lastSeenMode) {
        lastSeenMode = state.mode;
        setMode(MODE_MAP[state.mode], "system");
      }

      const zScores = Object.values(state.activeZScores).filter(
        (value): value is number => typeof value === "number",
      );
      setSignal({
        compositeScore: state.compositeScore,
        activeSignals: zScores.length,
        ready: zScores.length > 0,
      });
    });

    return () => {
      unsubscribe();
      engine.stop();
      engineRef.current = null;
    };
  }, [setMode]);

  return signal;
}
