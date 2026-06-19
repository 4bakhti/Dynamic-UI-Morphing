import type { ModeThresholds, OverrideModeMapping, SignalWeights } from "../types/scoring";

export interface BehaviourConfig {
  rollingWindowMs: number;
  scoringIntervalMs: number;
  latencyPingIntervalMs: number;
  latencyThresholdMs: number;
  latencyPingUrl: string;
  baselineMinimumSamples: number;
  baselineHistorySize: number;
  compositeWeights: SignalWeights;
  compositeClampMin: number;
  compositeClampMax: number;
  modeThresholds: ModeThresholds;
  twoSignalZThreshold: number;
  hysteresisReturnToStandardMs: number;
  transitionCooldownMs: number;
  repeatedValidationWindowMs: number;
  repeatedValidationCount: number;
  overrideModes: OverrideModeMapping;
}

/**
 * Default thresholds are intentionally centralized so judging demos can tune the
 * agent without changing collectors or scoring code. Values come directly from
 * the Behaviour Agent specification.
 */
export const DEFAULT_BEHAVIOUR_CONFIG: BehaviourConfig = {
  rollingWindowMs: 60_000,
  scoringIntervalMs: 30_000,
  latencyPingIntervalMs: 15_000,
  latencyThresholdMs: 500,
  latencyPingUrl: "/api/ping",
  baselineMinimumSamples: 30,
  baselineHistorySize: 500,
  compositeWeights: {
    actionArrival: 1.0,
    cursorDwell: 1.2,
    scrollReversal: 1.1,
    errorAbandonment: 1.8,
  },
  compositeClampMin: -3,
  compositeClampMax: 3,
  modeThresholds: {
    focusAbove: 1.8,
    clarityAbove: 1.2,
    standardLowerBound: -1.2,
    standardUpperBound: 1.2,
    explorationBelow: -1.2,
  },
  twoSignalZThreshold: 1.0,
  hysteresisReturnToStandardMs: 60_000,
  transitionCooldownMs: 120_000,
  repeatedValidationWindowMs: 120_000,
  repeatedValidationCount: 3,
  overrideModes: {
    helpPanelOpened: "clarity",
    taskAbandonmentDetected: "exploration",
    repeatedValidationErrors: "focus",
  },
};

export function createBehaviourConfig(overrides: Partial<BehaviourConfig> = {}): BehaviourConfig {
  return {
    ...DEFAULT_BEHAVIOUR_CONFIG,
    ...overrides,
    compositeWeights: {
      ...DEFAULT_BEHAVIOUR_CONFIG.compositeWeights,
      ...overrides.compositeWeights,
    },
    modeThresholds: {
      ...DEFAULT_BEHAVIOUR_CONFIG.modeThresholds,
      ...overrides.modeThresholds,
    },
    overrideModes: {
      ...DEFAULT_BEHAVIOUR_CONFIG.overrideModes,
      ...overrides.overrideModes,
    },
  };
}
