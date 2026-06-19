import type { ISignalCollector } from "./ISignalCollector";

interface TimedAction {
  timestamp: number;
}

/**
 * Tracks average time between click/keydown events in a rolling window.
 *
 * Privacy rationale: only event type and timestamp are used. Key identity,
 * keystroke content, target text, form values, and page semantics are ignored.
 */
export class ActionArrivalCollector implements ISignalCollector {
  private readonly windowMs: number;
  private readonly actions: TimedAction[] = [];

  public constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  public record(...args: unknown[]): void {
    const eventType = this.readEventType(args[0]);
    if (eventType !== "click" && eventType !== "keydown") {
      return;
    }

    const timestamp = this.readTimestamp(args[1]);
    this.actions.push({ timestamp });
    this.prune(timestamp);
  }

  public getCurrentValue(): number | null {
    const now = this.now();
    this.prune(now);

    if (this.actions.length < 2) {
      return null;
    }

    let totalGap = 0;
    for (let index = 1; index < this.actions.length; index += 1) {
      totalGap += this.actions[index].timestamp - this.actions[index - 1].timestamp;
    }

    return totalGap / (this.actions.length - 1);
  }

  public reset(): void {
    this.actions.length = 0;
  }

  private prune(now: number): void {
    const threshold = now - this.windowMs;
    while (this.actions.length > 0 && this.actions[0].timestamp < threshold) {
      this.actions.shift();
    }
  }

  private readEventType(candidate: unknown): string | null {
    if (typeof candidate === "string") {
      return candidate;
    }

    if (candidate instanceof Event) {
      return candidate.type;
    }

    if (typeof candidate === "object" && candidate !== null && "type" in candidate) {
      const type = (candidate as { type: unknown }).type;
      return typeof type === "string" ? type : null;
    }

    return null;
  }

  private readTimestamp(candidate: unknown): number {
    return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : this.now();
  }

  private now(): number {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }
}
