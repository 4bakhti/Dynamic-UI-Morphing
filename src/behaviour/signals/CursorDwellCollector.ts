import type { NumericRect } from "../types/signal";
import type { ISignalCollector } from "./ISignalCollector";

interface HoverStart {
  enteredAt: number;
  rectKey: string;
}

interface DwellSample {
  timestamp: number;
  durationMs: number;
}

/**
 * Measures mouseenter-to-click dwell duration on the same numeric target region.
 *
 * Privacy rationale: the collector stores only quantized bounding boxes and
 * timing. It never reads target text, attributes, input values, or selectors.
 */
export class CursorDwellCollector implements ISignalCollector {
  private readonly windowMs: number;
  private readonly activeRegions = new Map<string, HoverStart>();
  private readonly dwellSamples: DwellSample[] = [];

  public constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  public record(...args: unknown[]): void {
    const eventType = this.readEventType(args[0]);
    if (eventType !== "mouseenter" && eventType !== "click") {
      return;
    }

    const timestamp = this.readTimestamp(args[1]);
    const rect = this.readRect(args[0], args[2]);
    if (rect === null) {
      return;
    }

    const rectKey = this.createRectKey(rect);

    if (eventType === "mouseenter") {
      this.activeRegions.set(rectKey, { enteredAt: timestamp, rectKey });
      this.prune(timestamp);
      return;
    }

    const hoverStart = this.activeRegions.get(rectKey);
    if (hoverStart === undefined) {
      this.prune(timestamp);
      return;
    }

    const durationMs = timestamp - hoverStart.enteredAt;
    if (durationMs >= 0 && Number.isFinite(durationMs)) {
      this.dwellSamples.push({ timestamp, durationMs });
    }

    this.activeRegions.delete(hoverStart.rectKey);
    this.prune(timestamp);
  }

  public getCurrentValue(): number | null {
    const now = this.now();
    this.prune(now);

    if (this.dwellSamples.length === 0) {
      return null;
    }

    const total = this.dwellSamples.reduce((sum, sample) => sum + sample.durationMs, 0);
    return total / this.dwellSamples.length;
  }

  public reset(): void {
    this.activeRegions.clear();
    this.dwellSamples.length = 0;
  }

  private prune(now: number): void {
    const threshold = now - this.windowMs;
    while (this.dwellSamples.length > 0 && this.dwellSamples[0].timestamp < threshold) {
      this.dwellSamples.shift();
    }

    for (const [key, hoverStart] of this.activeRegions.entries()) {
      if (hoverStart.enteredAt < threshold) {
        this.activeRegions.delete(key);
      }
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

  private readRect(eventCandidate: unknown, explicitRect: unknown): NumericRect | null {
    const supplied = this.readExplicitRect(explicitRect);
    if (supplied !== null) {
      return supplied;
    }

    if (eventCandidate instanceof Event && eventCandidate.target instanceof Element) {
      const rect = eventCandidate.target.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    }

    if (typeof eventCandidate === "object" && eventCandidate !== null && "rect" in eventCandidate) {
      return this.readExplicitRect((eventCandidate as { rect: unknown }).rect);
    }

    return null;
  }

  private readExplicitRect(candidate: unknown): NumericRect | null {
    if (typeof candidate !== "object" || candidate === null) {
      return null;
    }

    const rect = candidate as Record<string, unknown>;
    const x = rect.x;
    const y = rect.y;
    const width = rect.width;
    const height = rect.height;

    if (
      typeof x === "number" &&
      typeof y === "number" &&
      typeof width === "number" &&
      typeof height === "number" &&
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      Number.isFinite(width) &&
      Number.isFinite(height)
    ) {
      return { x, y, width, height };
    }

    return null;
  }

  private createRectKey(rect: NumericRect): string {
    const quantize = (value: number): number => Math.round(value);
    return [
      quantize(rect.x),
      quantize(rect.y),
      quantize(rect.width),
      quantize(rect.height),
    ].join(":");
  }

  private now(): number {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }
}
