import { describe, expect, it } from "vitest";
import { BaselineManager } from "../baseline/BaselineManager";
import { ZScoreEngine } from "./ZScoreEngine";

const MINIMUM_SAMPLES = 30;

function warmBaseline(manager: BaselineManager, values: number[]): void {
  for (const value of values) {
    manager.addSample("actionArrival", value);
  }
}

describe("ZScoreEngine", () => {
  it("returns null until the baseline reaches the minimum sample count", () => {
    const manager = new BaselineManager(500);
    const engine = new ZScoreEngine(manager, MINIMUM_SAMPLES);

    warmBaseline(manager, Array.from({ length: MINIMUM_SAMPLES - 1 }, (_, i) => i));
    expect(engine.calculate("actionArrival", 10)).toBeNull();

    manager.addSample("actionArrival", MINIMUM_SAMPLES);
    expect(engine.calculate("actionArrival", 10)).not.toBeNull();
  });

  it("returns 0 when the baseline has no variance", () => {
    const manager = new BaselineManager(500);
    const engine = new ZScoreEngine(manager, MINIMUM_SAMPLES);

    warmBaseline(manager, Array.from({ length: MINIMUM_SAMPLES }, () => 7));
    expect(engine.calculate("actionArrival", 100)).toBe(0);
  });

  it("computes z = (x - mean) / stddev once warmed up", () => {
    const manager = new BaselineManager(500);
    const engine = new ZScoreEngine(manager, MINIMUM_SAMPLES);

    // Alternate 4 and 6: mean = 5, sample stddev is known.
    const samples = Array.from({ length: MINIMUM_SAMPLES }, (_, i) => (i % 2 === 0 ? 4 : 6));
    warmBaseline(manager, samples);

    const baseline = manager.getBaseline("actionArrival");
    const expected = (9 - baseline.mean) / baseline.standardDeviation;
    expect(engine.calculate("actionArrival", 9)).toBeCloseTo(expected, 10);
  });

  it("returns null for non-finite inputs", () => {
    const manager = new BaselineManager(500);
    const engine = new ZScoreEngine(manager, MINIMUM_SAMPLES);

    warmBaseline(manager, Array.from({ length: MINIMUM_SAMPLES }, (_, i) => i));
    expect(engine.calculate("actionArrival", Number.NaN)).toBeNull();
    expect(engine.calculate("actionArrival", Number.POSITIVE_INFINITY)).toBeNull();
  });
});
