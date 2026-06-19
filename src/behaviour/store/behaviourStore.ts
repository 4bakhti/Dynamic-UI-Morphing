import { create } from "zustand";
import type { BehaviourStoreState } from "../types/state";

export const initialBehaviourState: BehaviourStoreState = {
  mode: "standard",
  compositeScore: 0,
  activeZScores: {},
  trigger: "composite",
  lastTransitionAt: 0,
};

/**
 * The Behaviour Agent's only frontend integration surface.
 *
 * UI components subscribe to this Zustand store directly. The engine updates it
 * with numeric scores and mode names only, never page content or form values.
 */
export const useBehaviourStore = create<BehaviourStoreState>(() => initialBehaviourState);
