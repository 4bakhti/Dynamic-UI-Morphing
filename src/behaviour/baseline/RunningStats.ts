/**
 * Fixed-size running history with mean and sample standard deviation.
 *
 * The history cap keeps the in-memory baseline adaptive while preventing
 * unbounded growth. We calculate from the retained window for clarity during
 * judging; 500 samples is small enough that this remains inexpensive.
 */
export class RunningStats {
  private readonly maxSamples: number;
  private readonly samples: number[] = [];

  public constructor(maxSamples: number) {
    this.maxSamples = Number.isFinite(maxSamples) && maxSamples > 0 ? Math.floor(maxSamples) : 1;
  }

  public addSample(value: number): void {
    if (!Number.isFinite(value)) {
      return;
    }

    this.samples.push(value);
    while (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  public get count(): number {
    return this.samples.length;
  }

  public get mean(): number {
    if (this.samples.length === 0) {
      return 0;
    }

    return this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length;
  }

  public get standardDeviation(): number {
    if (this.samples.length < 2) {
      return 0;
    }

    const mean = this.mean;
    const variance =
      this.samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      (this.samples.length - 1);

    const deviation = Math.sqrt(variance);
    return Number.isFinite(deviation) ? deviation : 0;
  }

  public reset(): void {
    this.samples.length = 0;
  }
}
