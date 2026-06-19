import type { BaselineManager } from "../baseline/BaselineManager";
import type { SignalName } from "../types/signal";

/**
 * Calculates z = (x - mu) / sigma once a baseline has enough samples.
 *
 * Safety decisions:
 * - Fewer than 30 samples emits null so cold-start noise cannot drive UI morphs.
 * - sigma = 0 emits 0 because the user has no observed variance yet.
 * - non-finite results are suppressed to keep NaN/Infinity out of the pipeline.
 */
export class ZScoreEngine {
  private readonly baselineManager: BaselineManager;
  private readonly minimumSamples: number;

  public constructor(baselineManager: BaselineManager, minimumSamples: number) {
    this.baselineManager = baselineManager;
    this.minimumSamples = minimumSamples;
  }

  public calculate(signal: SignalName, value: number): number | null {
    if (!Number.isFinite(value)) {
      return null;
    }

    const baseline = this.baselineManager.getBaseline(signal);
    if (baseline.sampleCount < this.minimumSamples) {
      return null;
    }

    if (baseline.standardDeviation === 0) {
      return 0;
    }

    const zScore = (value - baseline.mean) / baseline.standardDeviation;
    return Number.isFinite(zScore) ? zScore : null;
  }
}
