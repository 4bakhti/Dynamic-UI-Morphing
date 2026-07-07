import { describe, expect, it } from "vitest";
import { RunningStats } from "./RunningStats";

describe("RunningStats", () => {
  it("computes the mean of retained samples", () => {
    const stats = new RunningStats(10);
    for (const value of [2, 4, 4, 4, 5, 5, 7, 9]) {
      stats.addSample(value);
    }

    expect(stats.count).toBe(8);
    expect(stats.mean).toBe(5);
  });

  it("computes the sample standard deviation (n - 1 denominator)", () => {
    const stats = new RunningStats(10);
    for (const value of [2, 4, 4, 4, 5, 5, 7, 9]) {
      stats.addSample(value);
    }

    // Sum of squared deviations is 32; sample variance = 32 / 7.
    expect(stats.standardDeviation).toBeCloseTo(Math.sqrt(32 / 7), 10);
  });

  it("evicts the oldest samples once the history cap is reached", () => {
    const stats = new RunningStats(3);
    for (const value of [1, 2, 3, 4, 5]) {
      stats.addSample(value);
    }

    expect(stats.count).toBe(3);
    expect(stats.mean).toBe(4); // retained window is [3, 4, 5]
  });

  it("ignores non-finite samples", () => {
    const stats = new RunningStats(10);
    stats.addSample(Number.NaN);
    stats.addSample(Number.POSITIVE_INFINITY);
    stats.addSample(5);

    expect(stats.count).toBe(1);
    expect(stats.mean).toBe(5);
  });

  it("reports zero standard deviation with fewer than two samples", () => {
    const stats = new RunningStats(10);
    expect(stats.standardDeviation).toBe(0);

    stats.addSample(42);
    expect(stats.standardDeviation).toBe(0);
  });

  it("clears all samples on reset", () => {
    const stats = new RunningStats(10);
    stats.addSample(1);
    stats.addSample(2);
    stats.reset();

    expect(stats.count).toBe(0);
    expect(stats.mean).toBe(0);
  });
});
