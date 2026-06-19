export { BehaviourEngine, type BehaviourEngineOptions } from "./engine/BehaviourEngine";
export { DEFAULT_BEHAVIOUR_CONFIG, createBehaviourConfig, type BehaviourConfig } from "./config/behaviourConfig";
export { useBehaviourStore, initialBehaviourState } from "./store/behaviourStore";
export { runBehaviourAgentDemo } from "./demo/simulator";

export type { BehaviourMode, BehaviourStoreState, BehaviourTrigger, BehaviourTransition } from "./types/state";
export type { ActiveZScores, CompositeScoreResult, ModeThresholds, SignalWeights } from "./types/scoring";
export type { SignalName, SignalValueSnapshot, NumericInteractionSample, NumericRect } from "./types/signal";
