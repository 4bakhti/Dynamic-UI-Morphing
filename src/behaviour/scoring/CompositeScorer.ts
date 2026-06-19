import type { SignalWeights, ActiveZScores, CompositeScoreResult } from "../types/scoring";
import type { SignalName } from "../types/signal";

/**
 * Computes S_comp = sum(z_i * w_i) / sum(w_i) over active z-scores only.
 *
 * Missing z-scores are excluded so cold-start signals do not dilute active
 * evidence. The final value is clamped to the specified [-3, +3] range.
 */
export class CompositeScorer {
  private readonly weights: SignalWeights;
  private readonly clampMin: number;
  private readonly clampMax: number;

  public constructor(weights: SignalWeights, clampMin: number, clampMax: number) {
    this.weights = weights;
    this.clampMin = clampMin;
    this.clampMax = clampMax;
  }

  public score(zScores: ActiveZScores): CompositeScoreResult {
    let weightedTotal = 0;
    let weightTotal = 0;
    const participatingSignals: SignalName[] = [];

    for (const [signal, zScore] of Object.entries(zScores) as [SignalName, number | undefined][]) {
      if (zScore === undefined || !Number.isFinite(zScore)) {
        continue;
      }

      const weight = this.weights[signal];
      if (!Number.isFinite(weight) || weight <= 0) {
        continue;
      }

      weightedTotal += zScore * weight;
      weightTotal += weight;
      participatingSignals.push(signal);
    }

    if (weightTotal === 0) {
      return { score: 0, participatingSignals };
    }

    const unclamped = weightedTotal / weightTotal;
    const score = Math.min(this.clampMax, Math.max(this.clampMin, unclamped));
    return { score: Number.isFinite(score) ? score : 0, participatingSignals };
  }
}
