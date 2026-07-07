import { describe, expect, it } from "vitest";
import type { SignalWeights } from "../types/scoring";
import { CompositeScorer } from "./CompositeScorer";

const WEIGHTS: SignalWeights = {
  actionArrival: 1.0,
  cursorDwell: 2.0,
  scrollReversal: 1.0,
  errorAbandonment: 1.0,
};

describe("CompositeScorer", () => {
  it("computes the weighted average over active z-scores only", () => {
    const scorer = new CompositeScorer(WEIGHTS, -3, 3);
    const result = scorer.score({ actionArrival: 1, cursorDwell: 2 });

    // (1*1 + 2*2) / (1 + 2) = 5/3; absent signals must not dilute the score.
    expect(result.score).toBeCloseTo(5 / 3, 10);
    expect(result.participatingSignals.sort()).toEqual(["actionArrival", "cursorDwell"]);
  });

  it("clamps the composite score to the configured range", () => {
    const scorer = new CompositeScorer(WEIGHTS, -3, 3);

    expect(scorer.score({ actionArrival: 50 }).score).toBe(3);
    expect(scorer.score({ actionArrival: -50 }).score).toBe(-3);
  });

  it("returns 0 with no participating signals", () => {
    const scorer = new CompositeScorer(WEIGHTS, -3, 3);
    const result = scorer.score({});

    expect(result.score).toBe(0);
    expect(result.participatingSignals).toEqual([]);
  });

  it("skips non-finite z-scores and non-positive weights", () => {
    const scorer = new CompositeScorer({ ...WEIGHTS, scrollReversal: 0 }, -3, 3);
    const result = scorer.score({
      actionArrival: Number.NaN,
      scrollReversal: 2, // weight 0 -> excluded
      cursorDwell: 1.5,
    });

    expect(result.score).toBeCloseTo(1.5, 10);
    expect(result.participatingSignals).toEqual(["cursorDwell"]);
  });
});
