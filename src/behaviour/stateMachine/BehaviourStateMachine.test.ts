import { describe, expect, it } from "vitest";
import { createBehaviourConfig, DEFAULT_BEHAVIOUR_CONFIG } from "../config/behaviourConfig";
import type { BehaviourStoreState } from "../types/state";
import { BehaviourStateMachine } from "./BehaviourStateMachine";

const CONFIG = createBehaviourConfig();
const COOLDOWN = DEFAULT_BEHAVIOUR_CONFIG.transitionCooldownMs;
const HYSTERESIS = DEFAULT_BEHAVIOUR_CONFIG.hysteresisReturnToStandardMs;

/** Two z-scores past the two-signal threshold in the "stressed" direction. */
const TWO_HIGH = { actionArrival: 2.5, cursorDwell: 2.2 };
/** Two z-scores past the threshold in the "stuck/idle" direction. */
const TWO_LOW = { actionArrival: -2.5, cursorDwell: -2.2 };

function makeStore(initial: Partial<BehaviourStoreState> = {}) {
  let state: BehaviourStoreState = {
    mode: "standard",
    compositeScore: 0,
    activeZScores: {},
    trigger: "composite",
    lastTransitionAt: 0,
    ...initial,
  };

  return {
    read: () => state,
    write: (partial: Partial<BehaviourStoreState>) => {
      state = { ...state, ...partial };
    },
    get state() {
      return state;
    },
  };
}

function makeMachine(initial: Partial<BehaviourStoreState> = {}) {
  const store = makeStore(initial);
  const machine = new BehaviourStateMachine(CONFIG, store.read, store.write);
  return { machine, store };
}

describe("mapScoreToMode", () => {
  it("maps scores to modes per the configured thresholds", () => {
    const { machine } = makeMachine();

    expect(machine.mapScoreToMode(2.0)).toBe("focus");
    expect(machine.mapScoreToMode(1.5)).toBe("clarity");
    expect(machine.mapScoreToMode(1.2)).toBe("standard"); // boundary is exclusive
    expect(machine.mapScoreToMode(0)).toBe("standard");
    expect(machine.mapScoreToMode(-1.2)).toBe("standard");
    expect(machine.mapScoreToMode(-2.0)).toBe("exploration");
  });

  it("treats non-finite scores as standard", () => {
    const { machine } = makeMachine();

    expect(machine.mapScoreToMode(Number.NaN)).toBe("standard");
    expect(machine.mapScoreToMode(Number.POSITIVE_INFINITY)).toBe("standard");
  });
});

describe("composite transitions", () => {
  it("transitions on the first qualifying tick without a prior cooldown", () => {
    const { machine, store } = makeMachine();

    const transition = machine.applyComposite(2.0, TWO_HIGH, 1_000);

    expect(transition).toEqual({ from: "standard", to: "focus", trigger: "composite", at: 1_000 });
    expect(store.state.mode).toBe("focus");
  });

  it("always records the composite score and z-scores, even when blocked", () => {
    const { machine, store } = makeMachine();

    machine.applyComposite(2.0, { actionArrival: 2.5 }, 1_000); // blocked by two-signal rule

    expect(store.state.mode).toBe("standard");
    expect(store.state.compositeScore).toBe(2.0);
    expect(store.state.activeZScores).toEqual({ actionArrival: 2.5 });
  });

  it("blocks a transition unless two signals cross the z-threshold in the right direction", () => {
    const { machine, store } = makeMachine();

    expect(machine.applyComposite(2.0, { actionArrival: 2.5 }, 1_000)).toBeNull();
    expect(machine.applyComposite(2.0, { actionArrival: 2.5, cursorDwell: 0.5 }, 2_000)).toBeNull();
    // Two signals, but in the wrong direction for a high-score mode.
    expect(machine.applyComposite(2.0, TWO_LOW, 3_000)).toBeNull();
    expect(store.state.mode).toBe("standard");

    expect(machine.applyComposite(-2.0, TWO_LOW, 4_000)).not.toBeNull();
    expect(store.state.mode).toBe("exploration");
  });

  it("enforces the cooldown between composite transitions", () => {
    const { machine, store } = makeMachine();

    machine.applyComposite(2.0, TWO_HIGH, 1_000); // -> focus

    // clarity <-> focus moves skip hysteresis but still respect the cooldown.
    expect(machine.applyComposite(1.5, TWO_HIGH, 1_000 + COOLDOWN - 1)).toBeNull();
    expect(store.state.mode).toBe("focus");

    const transition = machine.applyComposite(1.5, TWO_HIGH, 1_000 + COOLDOWN);
    expect(transition?.to).toBe("clarity");
  });

  it("requires the score to stay calm for the full hysteresis window before leaving a restrictive mode", () => {
    const { machine, store } = makeMachine();
    machine.forceMode("focus", 0);

    // First calm tick only starts the hysteresis clock.
    expect(machine.applyComposite(0, {}, 200_000)).toBeNull();
    // Still inside the window.
    expect(machine.applyComposite(0, {}, 200_000 + HYSTERESIS - 1)).toBeNull();
    expect(store.state.mode).toBe("focus");

    const transition = machine.applyComposite(0, {}, 200_000 + HYSTERESIS);
    expect(transition?.to).toBe("standard");
  });

  it("resets the hysteresis clock when the score spikes back up", () => {
    const { machine, store } = makeMachine();
    machine.forceMode("focus", 0);

    machine.applyComposite(0, {}, 200_000); // clock starts
    machine.applyComposite(2.0, TWO_HIGH, 210_000); // same mode; spike resets the clock

    // Would have satisfied the original window, but the clock restarted.
    machine.applyComposite(0, {}, 220_000);
    expect(machine.applyComposite(0, {}, 200_000 + HYSTERESIS + 1)).toBeNull();
    expect(store.state.mode).toBe("focus");

    const transition = machine.applyComposite(0, {}, 220_000 + HYSTERESIS);
    expect(transition?.to).toBe("standard");
  });
});

describe("forceMode (overrides)", () => {
  it("bypasses cooldown, hysteresis, and the two-signal rule", () => {
    const { machine, store } = makeMachine();

    const first = machine.forceMode("clarity", 10);
    expect(first).toEqual({ from: "standard", to: "clarity", trigger: "override", at: 10 });

    // Immediately again — no cooldown applies to overrides.
    const second = machine.forceMode("focus", 20);
    expect(second?.to).toBe("focus");
    expect(store.state.trigger).toBe("override");
  });

  it("starts the composite cooldown after an override transition", () => {
    const { machine, store } = makeMachine();

    machine.forceMode("focus", 1_000);

    // A composite move to clarity skips hysteresis but must wait out the cooldown.
    expect(machine.applyComposite(1.5, TWO_HIGH, 1_000 + COOLDOWN - 1)).toBeNull();
    expect(store.state.mode).toBe("focus");
    expect(machine.applyComposite(1.5, TWO_HIGH, 1_000 + COOLDOWN)?.to).toBe("clarity");
  });

  it("re-asserting the current mode records the trigger without a transition", () => {
    const { machine, store } = makeMachine();

    machine.forceMode("clarity", 10);
    const repeat = machine.forceMode("clarity", 20);

    expect(repeat).toBeNull();
    expect(store.state.mode).toBe("clarity");
    expect(store.state.lastTransitionAt).toBe(10);
  });
});
