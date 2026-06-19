import type { ISignalCollector } from "./ISignalCollector";

interface ErrorEventSample {
  timestamp: number;
}

/**
 * Counts validation and abandonment events per rolling window.
 *
 * Privacy rationale: event occurrence is counted, but validation messages,
 * field values, element labels, and DOM text are never read or stored.
 */
export class ErrorAbandonmentCollector implements ISignalCollector {
  private readonly windowMs: number;
  private readonly events: ErrorEventSample[] = [];

  public constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  public record(...args: unknown[]): void {
    const eventType = this.readEventType(args[0]);
    if (eventType !== "invalid" && eventType !== "beforeunload") {
      return;
    }

    const timestamp = this.readTimestamp(args[1]);
    this.events.push({ timestamp });
    this.prune(timestamp);
  }

  public getCurrentValue(): number | null {
    const now = this.now();
    this.prune(now);
    return this.events.length;
  }

  public reset(): void {
    this.events.length = 0;
  }

  private prune(now: number): void {
    const threshold = now - this.windowMs;
    while (this.events.length > 0 && this.events[0].timestamp < threshold) {
      this.events.shift();
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
