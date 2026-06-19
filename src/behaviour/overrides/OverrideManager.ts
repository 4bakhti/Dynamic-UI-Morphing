import type { BehaviourConfig } from "../config/behaviourConfig";
import type { BehaviourStateMachine } from "../stateMachine/BehaviourStateMachine";

/**
 * Handles explicit user/task overrides that bypass scoring, cooldown, and
 * hysteresis. Validation errors are keyed by numeric codes supplied by the app,
 * keeping messages and field contents out of the telemetry path.
 */
export class OverrideManager {
  private readonly config: BehaviourConfig;
  private readonly stateMachine: BehaviourStateMachine;
  private readonly validationErrorTimestamps = new Map<number, number[]>();

  public constructor(config: BehaviourConfig, stateMachine: BehaviourStateMachine) {
    this.config = config;
    this.stateMachine = stateMachine;
  }

  public recordHelpPanelOpened(timestamp = this.now()): void {
    this.stateMachine.forceMode(this.config.overrideModes.helpPanelOpened, timestamp);
  }

  public recordTaskAbandonmentDetected(timestamp = this.now()): void {
    this.stateMachine.forceMode(this.config.overrideModes.taskAbandonmentDetected, timestamp);
  }

  public recordValidationError(errorCode: number, timestamp = this.now()): void {
    if (!Number.isFinite(errorCode)) {
      return;
    }

    const windowStart = timestamp - this.config.repeatedValidationWindowMs;
    this.pruneValidationErrors(windowStart);

    const existing = this.validationErrorTimestamps.get(errorCode) ?? [];
    const recent = existing.filter((seenAt) => seenAt >= windowStart);
    recent.push(timestamp);
    this.validationErrorTimestamps.set(errorCode, recent);

    if (recent.length >= this.config.repeatedValidationCount) {
      this.validationErrorTimestamps.set(errorCode, []);
      this.stateMachine.forceMode(this.config.overrideModes.repeatedValidationErrors, timestamp);
    }
  }

  public reset(): void {
    this.validationErrorTimestamps.clear();
  }

  private pruneValidationErrors(windowStart: number): void {
    for (const [errorCode, timestamps] of this.validationErrorTimestamps.entries()) {
      const recent = timestamps.filter((seenAt) => seenAt >= windowStart);
      if (recent.length === 0) {
        this.validationErrorTimestamps.delete(errorCode);
      } else {
        this.validationErrorTimestamps.set(errorCode, recent);
      }
    }
  }

  private now(): number {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }
}
