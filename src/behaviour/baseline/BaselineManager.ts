import { RunningStats } from "./RunningStats";
import { SIGNAL_NAMES, type SignalName } from "../types/signal";

export interface SignalBaseline {
  mean: number;
  standardDeviation: number;
  sampleCount: number;
}

/**
 * Owns the per-user, in-memory signal baselines.
 *
 * Persistence is intentionally not implemented for the hackathon scope, but
 * this class is the future extension point for loading/saving baseline samples.
 */
export class BaselineManager {
  private readonly baselines = new Map<SignalName, RunningStats>();

  public constructor(historySize: number) {
    for (const signal of SIGNAL_NAMES) {
      this.baselines.set(signal, new RunningStats(historySize));
    }
  }

  public addSample(signal: SignalName, value: number): void {
    this.getStats(signal).addSample(value);
  }

  public getBaseline(signal: SignalName): SignalBaseline {
    const stats = this.getStats(signal);
    return {
      mean: stats.mean,
      standardDeviation: stats.standardDeviation,
      sampleCount: stats.count,
    };
  }

  public reset(): void {
    for (const stats of this.baselines.values()) {
      stats.reset();
    }
  }

  private getStats(signal: SignalName): RunningStats {
    const stats = this.baselines.get(signal);
    if (stats === undefined) {
      throw new Error(`Unknown signal baseline: ${signal}`);
    }

    return stats;
  }
}
