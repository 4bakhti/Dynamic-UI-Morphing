export type BehaviourMode = "standard" | "clarity" | "focus" | "exploration";

export type BehaviourTrigger = "composite" | "override";

/**
 * Zustand state exposed to the frontend. The Behaviour Agent writes this store
 * directly; UI components should only subscribe to these numeric/mode fields.
 */
export interface BehaviourStoreState {
  mode: BehaviourMode;
  compositeScore: number;
  activeZScores: Record<string, number>;
  trigger: BehaviourTrigger;
  lastTransitionAt: number;
}

export interface BehaviourTransition {
  from: BehaviourMode;
  to: BehaviourMode;
  trigger: BehaviourTrigger;
  at: number;
}
