/**
 * Pluggable collector contract. Implementations accept unknown inputs so the
 * engine can feed browser events while tests and demos can feed numeric samples.
 */
export interface ISignalCollector {
  record(...args: unknown[]): void;
  getCurrentValue(): number | null;
  reset(): void;
}
