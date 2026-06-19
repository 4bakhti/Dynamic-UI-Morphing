import type { ISignalCollector } from "./ISignalCollector";

interface ScrollSample {
  timestamp: number;
  direction: -1 | 1;
  reversed: boolean;
}

/**
 * Tracks wheel direction changes as reversals / total wheel events.
 *
 * Privacy rationale: only wheel delta sign and timing are retained. Scroll
 * positions and page content are not inspected.
 */
export class ScrollReversalCollector implements ISignalCollector {
  private readonly windowMs: number;
  private readonly samples: ScrollSample[] = [];
  private lastDirection: -1 | 1 | null = null;

  public constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  public record(...args: unknown[]): void {
    const deltaY = this.readDeltaY(args[0]);
    if (deltaY === null || deltaY === 0) {
      return;
    }

    const timestamp = this.readTimestamp(args[1]);
    this.prune(timestamp);

    const direction: -1 | 1 = deltaY > 0 ? 1 : -1;
    const reversed = this.lastDirection !== null && this.lastDirection !== direction;
    this.samples.push({ timestamp, direction, reversed });
    this.lastDirection = direction;
    this.prune(timestamp);
  }

  public getCurrentValue(): number | null {
    const now = this.now();
    this.prune(now);

    if (this.samples.length === 0) {
      return null;
    }

    const reversals = this.samples.filter((sample) => sample.reversed).length;
    return reversals / this.samples.length;
  }

  public reset(): void {
    this.samples.length = 0;
    this.lastDirection = null;
  }

  private prune(now: number): void {
    const threshold = now - this.windowMs;
    while (this.samples.length > 0 && this.samples[0].timestamp < threshold) {
      this.samples.shift();
    }

    this.lastDirection = this.samples.length > 0 ? this.samples[this.samples.length - 1].direction : null;
  }

  private readDeltaY(candidate: unknown): number | null {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }

    if (candidate instanceof WheelEvent) {
      return candidate.deltaY;
    }

    if (typeof candidate === "object" && candidate !== null && "deltaY" in candidate) {
      const deltaY = (candidate as { deltaY: unknown }).deltaY;
      return typeof deltaY === "number" && Number.isFinite(deltaY) ? deltaY : null;
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
