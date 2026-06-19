import { BaselineManager } from "../baseline/BaselineManager";
import { createBehaviourConfig, type BehaviourConfig } from "../config/behaviourConfig";
import { LatencyInhibitor } from "../inhibitors/LatencyInhibitor";
import { SelectionInhibitor } from "../inhibitors/SelectionInhibitor";
import { OverrideManager } from "../overrides/OverrideManager";
import { CompositeScorer } from "../scoring/CompositeScorer";
import { ZScoreEngine } from "../scoring/ZScoreEngine";
import { ActionArrivalCollector } from "../signals/ActionArrivalCollector";
import { CursorDwellCollector } from "../signals/CursorDwellCollector";
import { ErrorAbandonmentCollector } from "../signals/ErrorAbandonmentCollector";
import type { ISignalCollector } from "../signals/ISignalCollector";
import { ScrollReversalCollector } from "../signals/ScrollReversalCollector";
import { useBehaviourStore } from "../store/behaviourStore";
import { SIGNAL_NAMES, type SignalName } from "../types/signal";
import type { ActiveZScores } from "../types/scoring";
import { BehaviourStateMachine } from "../stateMachine/BehaviourStateMachine";

export interface BehaviourEngineOptions {
  config?: Partial<BehaviourConfig>;
}

/**
 * Browser-side telemetry engine for the Dynamic UI Morphing Framework.
 *
 * The engine observes only timing, counts, coordinates, deltas, and bounding-box
 * geometry. It never reads keystroke content, form values, DOM text, clipboard
 * data, screenshots, or semantic page content.
 */
export class BehaviourEngine {
  private readonly config: BehaviourConfig;
  private readonly collectors: Record<SignalName, ISignalCollector>;
  private readonly baselineManager: BaselineManager;
  private readonly zScoreEngine: ZScoreEngine;
  private readonly compositeScorer: CompositeScorer;
  private readonly selectionInhibitor: SelectionInhibitor;
  private readonly latencyInhibitor: LatencyInhibitor;
  private readonly stateMachine: BehaviourStateMachine;
  private readonly overrideManager: OverrideManager;
  private scoringIntervalId: number | null = null;
  private started = false;
  private taskIncomplete = false;

  private readonly handleClick = (event: MouseEvent): void => {
    const timestamp = this.now();
    this.collectors.actionArrival.record(event, timestamp);
    this.collectors.cursorDwell.record(event, timestamp);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.collectors.actionArrival.record(event, this.now());
  };

  private readonly handleMouseEnter = (event: MouseEvent): void => {
    this.collectors.cursorDwell.record(event, this.now());
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    this.collectors.scrollReversal.record(event, this.now());
  };

  private readonly handleInvalid = (): void => {
    const timestamp = this.now();
    this.collectors.errorAbandonment.record("invalid", timestamp);
  };

  private readonly handleBeforeUnload = (): void => {
    if (!this.taskIncomplete) {
      return;
    }

    const timestamp = this.now();
    this.collectors.errorAbandonment.record("beforeunload", timestamp);
    this.overrideManager.recordTaskAbandonmentDetected(timestamp);
  };

  public constructor(options: BehaviourEngineOptions = {}) {
    this.config = createBehaviourConfig(options.config);
    this.collectors = {
      actionArrival: new ActionArrivalCollector(this.config.rollingWindowMs),
      cursorDwell: new CursorDwellCollector(this.config.rollingWindowMs),
      scrollReversal: new ScrollReversalCollector(this.config.rollingWindowMs),
      errorAbandonment: new ErrorAbandonmentCollector(this.config.rollingWindowMs),
    };
    this.baselineManager = new BaselineManager(this.config.baselineHistorySize);
    this.zScoreEngine = new ZScoreEngine(this.baselineManager, this.config.baselineMinimumSamples);
    this.compositeScorer = new CompositeScorer(
      this.config.compositeWeights,
      this.config.compositeClampMin,
      this.config.compositeClampMax,
    );
    this.selectionInhibitor = new SelectionInhibitor();
    this.latencyInhibitor = new LatencyInhibitor(
      this.config.latencyPingUrl,
      this.config.latencyPingIntervalMs,
      this.config.latencyThresholdMs,
    );
    this.stateMachine = new BehaviourStateMachine(
      this.config,
      useBehaviourStore.getState,
      useBehaviourStore.setState,
    );
    this.overrideManager = new OverrideManager(this.config, this.stateMachine);
  }

  /** Starts browser event collection and periodic scoring. */
  public start(): void {
    if (this.started || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    document.addEventListener("click", this.handleClick, { capture: true, passive: true });
    document.addEventListener("keydown", this.handleKeyDown, { capture: true, passive: true });
    document.addEventListener("mouseenter", this.handleMouseEnter, { capture: true, passive: true });
    document.addEventListener("wheel", this.handleWheel, { capture: true, passive: true });
    document.addEventListener("invalid", this.handleInvalid, true);
    window.addEventListener("beforeunload", this.handleBeforeUnload);

    this.selectionInhibitor.start();
    this.latencyInhibitor.start();
    this.scoringIntervalId = window.setInterval(() => this.computeScore(), this.config.scoringIntervalMs);
    this.started = true;
  }

  /** Stops all browser listeners and intervals. */
  public stop(): void {
    if (!this.started || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    document.removeEventListener("click", this.handleClick, { capture: true });
    document.removeEventListener("keydown", this.handleKeyDown, { capture: true });
    document.removeEventListener("mouseenter", this.handleMouseEnter, { capture: true });
    document.removeEventListener("wheel", this.handleWheel, { capture: true });
    document.removeEventListener("invalid", this.handleInvalid, true);
    window.removeEventListener("beforeunload", this.handleBeforeUnload);

    if (this.scoringIntervalId !== null) {
      window.clearInterval(this.scoringIntervalId);
      this.scoringIntervalId = null;
    }

    this.selectionInhibitor.stop();
    this.latencyInhibitor.stop();
    this.started = false;
  }

  /** Marks the current task incomplete so beforeunload can count abandonment. */
  public markTaskIncomplete(): void {
    this.taskIncomplete = true;
  }

  /** Marks the current task complete, disabling beforeunload abandonment. */
  public markTaskComplete(): void {
    this.taskIncomplete = false;
  }

  /** App-level override for an opened help panel. */
  public recordHelpPanelOpened(): void {
    this.overrideManager.recordHelpPanelOpened();
  }

  /** App-level override for explicit task abandonment. */
  public recordTaskAbandonmentDetected(): void {
    const timestamp = this.now();
    this.collectors.errorAbandonment.record("beforeunload", timestamp);
    this.overrideManager.recordTaskAbandonmentDetected(timestamp);
  }

  /**
   * Records a numeric validation error code. The app should provide stable
   * numeric categories, not messages, field names, labels, or input values.
   */
  public recordValidationError(errorCode: number): void {
    const timestamp = this.now();
    this.collectors.errorAbandonment.record("invalid", timestamp);
    this.overrideManager.recordValidationError(errorCode, timestamp);
  }

  /** Computes one scoring tick immediately. Useful for tests and demos. */
  public computeScore(timestamp = this.now()): void {
    if (this.selectionInhibitor.isInhibited() || this.latencyInhibitor.isInhibited()) {
      return;
    }

    const activeZScores: ActiveZScores = {};

    for (const signal of SIGNAL_NAMES) {
      const value = this.collectors[signal].getCurrentValue();
      if (value === null || !Number.isFinite(value)) {
        continue;
      }

      const zScore = this.zScoreEngine.calculate(signal, value);
      if (zScore !== null) {
        activeZScores[signal] = zScore;
      }

      this.baselineManager.addSample(signal, value);
    }

    const composite = this.compositeScorer.score(activeZScores);
    this.stateMachine.applyComposite(composite.score, activeZScores, timestamp);
  }

  public getCollector(signal: SignalName): ISignalCollector {
    return this.collectors[signal];
  }

  private now(): number {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }
}
