import type { SignalName } from "./signal";
import type { BehaviourMode } from "./state";

export type SignalWeights = Record<SignalName, number>;

export type ActiveZScores = Partial<Record<SignalName, number>>;

export interface ModeThresholds {
  focusAbove: number;
  clarityAbove: number;
  standardLowerBound: number;
  standardUpperBound: number;
  explorationBelow: number;
}

export interface CompositeScoreResult {
  score: number;
  participatingSignals: SignalName[];
}

export interface ZScoreResult {
  signal: SignalName;
  zScore: number | null;
  sampleCount: number;
}

export interface OverrideModeMapping {
  helpPanelOpened: BehaviourMode;
  taskAbandonmentDetected: BehaviourMode;
  repeatedValidationErrors: BehaviourMode;
}
