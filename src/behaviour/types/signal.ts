export const SIGNAL_NAMES = [
  "actionArrival",
  "cursorDwell",
  "scrollReversal",
  "errorAbandonment",
] as const;

export type SignalName = (typeof SIGNAL_NAMES)[number];

export type RawInteractionName =
  | "click"
  | "keydown"
  | "mouseenter"
  | "wheel"
  | "invalid"
  | "beforeunload";

export interface NumericRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NumericInteractionSample {
  type: RawInteractionName;
  timestamp: number;
  x?: number;
  y?: number;
  deltaY?: number;
  rect?: NumericRect;
}

export interface SignalValueSnapshot {
  name: SignalName;
  value: number | null;
}
