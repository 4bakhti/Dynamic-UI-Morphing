import { BaselineManager } from "../baseline/BaselineManager";
import { DEFAULT_BEHAVIOUR_CONFIG } from "../config/behaviourConfig";
import { OverrideManager } from "../overrides/OverrideManager";
import { CompositeScorer } from "../scoring/CompositeScorer";
import { ZScoreEngine } from "../scoring/ZScoreEngine";
import { ActionArrivalCollector } from "../signals/ActionArrivalCollector";
import { CursorDwellCollector } from "../signals/CursorDwellCollector";
import { ErrorAbandonmentCollector } from "../signals/ErrorAbandonmentCollector";
import type { ISignalCollector } from "../signals/ISignalCollector";
import { ScrollReversalCollector } from "../signals/ScrollReversalCollector";
import { BehaviourStateMachine } from "../stateMachine/BehaviourStateMachine";
import { initialBehaviourState, useBehaviourStore } from "../store/behaviourStore";
import { SIGNAL_NAMES, type SignalName } from "../types/signal";
import type { ActiveZScores } from "../types/scoring";

type CollectorMap = Record<SignalName, ISignalCollector>;

/**
 * Runs a console-visible demo of signal values, z-scores, composite score, and
 * mode transitions. This is deterministic and uses numeric/geometry samples.
 */
export function runBehaviourAgentDemo(): void {
  const config = DEFAULT_BEHAVIOUR_CONFIG;
  const collectors: CollectorMap = {
    actionArrival: new ActionArrivalCollector(config.rollingWindowMs),
    cursorDwell: new CursorDwellCollector(config.rollingWindowMs),
    scrollReversal: new ScrollReversalCollector(config.rollingWindowMs),
    errorAbandonment: new ErrorAbandonmentCollector(config.rollingWindowMs),
  };
  const baseline = new BaselineManager(config.baselineHistorySize);
  const zEngine = new ZScoreEngine(baseline, config.baselineMinimumSamples);
  const scorer = new CompositeScorer(config.compositeWeights, config.compositeClampMin, config.compositeClampMax);

  useBehaviourStore.setState(initialBehaviourState, true);

  const stateMachine = new BehaviourStateMachine(config, useBehaviourStore.getState, useBehaviourStore.setState);
  const overrides = new OverrideManager(config, stateMachine);

  let now = 0;
  const normalValues = {
    actionArrival: 800,
    cursorDwell: 350,
    scrollReversal: 0.15,
    errorAbandonment: 0,
  };

  for (let sample = 0; sample < config.baselineMinimumSamples; sample += 1) {
    baseline.addSample("actionArrival", normalValues.actionArrival + (sample % 5) * 20);
    baseline.addSample("cursorDwell", normalValues.cursorDwell + (sample % 4) * 15);
    baseline.addSample("scrollReversal", normalValues.scrollReversal + (sample % 3) * 0.02);
    baseline.addSample("errorAbandonment", normalValues.errorAbandonment + (sample % 2));
  }

  console.log("[Behaviour demo] baseline ready", {
    samplesPerSignal: config.baselineMinimumSamples,
    privacy: "numeric timing, counts, deltas, and bounding boxes only",
  });

  now = simulateRapidClicking(collectors, now);
  scoreAndLog("rapid clicking", collectors, baseline, zEngine, scorer, stateMachine, now);

  now = simulateIdlePeriod(collectors, now);
  scoreAndLog("idle period", collectors, baseline, zEngine, scorer, stateMachine, now);

  now = simulateLongCursorDwell(collectors, now);
  scoreAndLog("long cursor dwell", collectors, baseline, zEngine, scorer, stateMachine, now);

  now = simulateScrollThrashing(collectors, now);
  scoreAndLog("scroll thrashing", collectors, baseline, zEngine, scorer, stateMachine, now);

  now = simulateValidationErrors(collectors, overrides, now);
  scoreAndLog("validation errors", collectors, baseline, zEngine, scorer, stateMachine, now);

  overrides.recordHelpPanelOpened(now + 1_000);
  console.log("[Behaviour demo] override: help panel opened", useBehaviourStore.getState());

  overrides.recordTaskAbandonmentDetected(now + 2_000);
  console.log("[Behaviour demo] override: task abandonment", useBehaviourStore.getState());
}

function simulateRapidClicking(collectors: CollectorMap, start: number): number {
  let timestamp = start;
  for (let index = 0; index < 12; index += 1) {
    collectors.actionArrival.record("click", timestamp);
    timestamp += 120;
  }

  return timestamp;
}

function simulateIdlePeriod(collectors: CollectorMap, start: number): number {
  const timestamp = start + 6_000;
  collectors.actionArrival.record("keydown", timestamp);
  return timestamp;
}

function simulateLongCursorDwell(collectors: CollectorMap, start: number): number {
  const rect = { x: 120, y: 80, width: 240, height: 44 };
  collectors.cursorDwell.record("mouseenter", start, rect);
  collectors.cursorDwell.record("click", start + 2_800, rect);
  return start + 2_800;
}

function simulateScrollThrashing(collectors: CollectorMap, start: number): number {
  let timestamp = start;
  const deltas = [120, -120, 90, -80, 70, -70, 100, -100];
  for (const deltaY of deltas) {
    collectors.scrollReversal.record(deltaY, timestamp);
    timestamp += 200;
  }

  return timestamp;
}

function simulateValidationErrors(collectors: CollectorMap, overrides: OverrideManager, start: number): number {
  let timestamp = start;
  const numericErrorCode = 42;
  for (let index = 0; index < 3; index += 1) {
    collectors.errorAbandonment.record("invalid", timestamp);
    overrides.recordValidationError(numericErrorCode, timestamp);
    timestamp += 20_000;
  }

  console.log("[Behaviour demo] override: repeated validation errors", useBehaviourStore.getState());
  return timestamp;
}

function scoreAndLog(
  label: string,
  collectors: CollectorMap,
  baseline: BaselineManager,
  zEngine: ZScoreEngine,
  scorer: CompositeScorer,
  stateMachine: BehaviourStateMachine,
  timestamp: number,
): void {
  const values: Partial<Record<SignalName, number>> = {};
  const zScores: ActiveZScores = {};

  for (const signal of SIGNAL_NAMES) {
    const value = collectors[signal].getCurrentValue();
    if (value === null) {
      continue;
    }

    values[signal] = value;
    const zScore = zEngine.calculate(signal, value);
    if (zScore !== null) {
      zScores[signal] = zScore;
    }

    baseline.addSample(signal, value);
  }

  const composite = scorer.score(zScores);
  const transition = stateMachine.applyComposite(composite.score, zScores, timestamp);

  console.log(`[Behaviour demo] ${label}`, {
    signalValues: values,
    zScores,
    compositeScore: composite.score,
    participatingSignals: composite.participatingSignals,
    transition,
    store: useBehaviourStore.getState(),
  });
}
