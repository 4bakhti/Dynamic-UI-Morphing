import type { BehaviourConfig } from "../config/behaviourConfig";
import type { ActiveZScores } from "../types/scoring";
import type { BehaviourMode, BehaviourStoreState, BehaviourTransition } from "../types/state";

type StoreWriter = (state: Partial<BehaviourStoreState>) => void;
type StoreReader = () => BehaviourStoreState;

/**
 * Validates all mode transitions before writing to Zustand.
 *
 * Composite transitions obey cooldown, two-signal validation, and hysteresis.
 * Overrides enter through forceMode and intentionally bypass those guards.
 */
export class BehaviourStateMachine {
  private readonly config: BehaviourConfig;
  private readonly readStore: StoreReader;
  private readonly writeStore: StoreWriter;
  private belowStandardStartedAt: number | null = null;
  private hasTransition = false;

  public constructor(config: BehaviourConfig, readStore: StoreReader, writeStore: StoreWriter) {
    this.config = config;
    this.readStore = readStore;
    this.writeStore = writeStore;
    this.hasTransition = readStore().lastTransitionAt > 0;
  }

  public applyComposite(score: number, zScores: ActiveZScores, timestamp = this.now()): BehaviourTransition | null {
    const current = this.readStore();
    const desiredMode = this.mapScoreToMode(score);

    this.writeStore({
      compositeScore: score,
      activeZScores: this.toRecord(zScores),
    });

    if (desiredMode === current.mode) {
      this.updateHysteresisClock(current.mode, score, timestamp);
      return null;
    }

    if (!this.canLeaveCurrentMode(current.mode, desiredMode, score, timestamp)) {
      return null;
    }

    if (!this.cooldownSatisfied(current.lastTransitionAt, timestamp)) {
      return null;
    }

    if (!this.twoSignalRuleSatisfied(desiredMode, zScores)) {
      return null;
    }

    return this.commitTransition(current.mode, desiredMode, "composite", timestamp);
  }

  public forceMode(mode: BehaviourMode, timestamp = this.now()): BehaviourTransition | null {
    const current = this.readStore();
    if (current.mode === mode) {
      this.writeStore({
        trigger: "override",
      });
      return null;
    }

    this.belowStandardStartedAt = null;
    return this.commitTransition(current.mode, mode, "override", timestamp);
  }

  public mapScoreToMode(score: number): BehaviourMode {
    if (!Number.isFinite(score)) {
      return "standard";
    }

    const thresholds = this.config.modeThresholds;

    if (score > thresholds.focusAbove) {
      return "focus";
    }

    if (score > thresholds.clarityAbove && score <= thresholds.focusAbove) {
      return "clarity";
    }

    if (score < thresholds.explorationBelow) {
      return "exploration";
    }

    if (score >= thresholds.standardLowerBound && score <= thresholds.standardUpperBound) {
      return "standard";
    }

    return "standard";
  }

  private canLeaveCurrentMode(
    currentMode: BehaviourMode,
    desiredMode: BehaviourMode,
    score: number,
    timestamp: number,
  ): boolean {
    if (!this.isRestrictiveMode(currentMode)) {
      this.belowStandardStartedAt = null;
      return true;
    }

    if (desiredMode === currentMode) {
      return true;
    }

    /*
     * Hysteresis prevents focus/clarity from flickering away on a single calmer
     * scoring tick. Once in a restrictive mode, any exit requires the score to
     * stay below the return threshold continuously for the configured duration.
     */
    if (score >= this.config.modeThresholds.standardUpperBound) {
      this.belowStandardStartedAt = null;
      return false;
    }

    if (this.belowStandardStartedAt === null) {
      this.belowStandardStartedAt = timestamp;
      return false;
    }

    return timestamp - this.belowStandardStartedAt >= this.config.hysteresisReturnToStandardMs;
  }

  private updateHysteresisClock(mode: BehaviourMode, score: number, timestamp: number): void {
    if (!this.isRestrictiveMode(mode)) {
      this.belowStandardStartedAt = null;
      return;
    }

    if (score < this.config.modeThresholds.standardUpperBound) {
      this.belowStandardStartedAt ??= timestamp;
      return;
    }

    this.belowStandardStartedAt = null;
  }

  private cooldownSatisfied(lastTransitionAt: number, timestamp: number): boolean {
    return !this.hasTransition || timestamp - lastTransitionAt >= this.config.transitionCooldownMs;
  }

  private isRestrictiveMode(mode: BehaviourMode): boolean {
    return mode === "clarity" || mode === "focus";
  }

  private twoSignalRuleSatisfied(desiredMode: BehaviourMode, zScores: ActiveZScores): boolean {
    if (desiredMode === "standard") {
      return true;
    }

    const values = Object.values(zScores).filter((value): value is number => typeof value === "number");

    if (desiredMode === "exploration") {
      return values.filter((value) => value < -this.config.twoSignalZThreshold).length >= 2;
    }

    return values.filter((value) => value > this.config.twoSignalZThreshold).length >= 2;
  }

  private commitTransition(
    from: BehaviourMode,
    to: BehaviourMode,
    trigger: "composite" | "override",
    timestamp: number,
  ): BehaviourTransition {
    this.writeStore({
      mode: to,
      trigger,
      lastTransitionAt: timestamp,
    });
    this.hasTransition = true;

    return { from, to, trigger, at: timestamp };
  }

  private toRecord(zScores: ActiveZScores): Record<string, number> {
    const record: Record<string, number> = {};
    for (const [signal, zScore] of Object.entries(zScores)) {
      if (typeof zScore === "number" && Number.isFinite(zScore)) {
        record[signal] = zScore;
      }
    }

    return record;
  }

  private now(): number {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }
}
