/**
 * Measures lightweight application latency with fetch("/api/ping").
 *
 * Scoring is paused when measured round-trip latency exceeds the configured
 * threshold. Network failures are treated as inhibited because a broken ping is
 * external noise that could otherwise be mistaken for user cognitive load.
 */
export class LatencyInhibitor {
  private readonly pingUrl: string;
  private readonly intervalMs: number;
  private readonly thresholdMs: number;
  private intervalId: number | null = null;
  private inhibited = false;
  private active = false;
  private inFlight = false;
  private lastLatencyMs: number | null = null;
  private requestGeneration = 0;

  public constructor(pingUrl: string, intervalMs: number, thresholdMs: number) {
    this.pingUrl = pingUrl;
    this.intervalMs = intervalMs;
    this.thresholdMs = thresholdMs;
  }

  public start(): void {
    if (this.intervalId !== null || typeof window === "undefined") {
      return;
    }

    this.active = true;
    this.requestGeneration += 1;
    const generation = this.requestGeneration;
    void this.measure(generation);
    this.intervalId = window.setInterval(() => {
      void this.measure(generation);
    }, this.intervalMs);
  }

  public stop(): void {
    if (this.intervalId === null || typeof window === "undefined") {
      return;
    }

    window.clearInterval(this.intervalId);
    this.intervalId = null;
    this.active = false;
    this.inFlight = false;
    this.requestGeneration += 1;
    this.inhibited = false;
    this.lastLatencyMs = null;
  }

  public isInhibited(): boolean {
    return this.inhibited;
  }

  public getLastLatencyMs(): number | null {
    return this.lastLatencyMs;
  }

  private async measure(generation: number): Promise<void> {
    if (!this.active || this.inFlight) {
      return;
    }

    if (typeof fetch !== "function") {
      this.inhibited = false;
      return;
    }

    this.inFlight = true;
    const start = this.now();

    try {
      await fetch(this.pingUrl, {
        cache: "no-store",
        credentials: "same-origin",
        method: "GET",
      });

      if (!this.isCurrentGeneration(generation)) {
        return;
      }

      const latency = this.now() - start;
      this.lastLatencyMs = latency;
      this.inhibited = latency > this.thresholdMs;
    } catch {
      if (!this.isCurrentGeneration(generation)) {
        return;
      }

      this.lastLatencyMs = this.thresholdMs + 1;
      this.inhibited = true;
    } finally {
      if (this.isCurrentGeneration(generation)) {
        this.inFlight = false;
      }
    }
  }

  private isCurrentGeneration(generation: number): boolean {
    return this.active && generation === this.requestGeneration;
  }

  private now(): number {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }
}
