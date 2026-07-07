# TASK

You are a senior TypeScript architect and frontend systems engineer.

Your task is to design and implement a complete browser-side telemetry engine called **Behaviour Agent** for a hackathon project named **Dynamic UI Morphing Framework**.

The implementation must be production-quality TypeScript, but optimized for clarity and explainability during hackathon judging.

---

# NON-NEGOTIABLE CONSTRAINTS

## Privacy-first by design

The engine MUST NEVER:

* Read keystroke content
* Read form values
* Read clipboard contents
* Read DOM text content
* Read screenshots
* Read semantic user data
* Inspect page content beyond geometry/bounding boxes

The engine MAY ONLY observe:

* Event timing
* Event frequency
* Event counts
* Event intervals
* Mouse coordinates
* Position deltas
* Bounding boxes
* Scroll direction
* Numeric interaction metadata

No personal or semantic data may enter the scoring pipeline.

---

# TECHNOLOGY REQUIREMENTS

Language:

* Strict TypeScript
* ES2022 target

Runtime:

* Browser only
* No Node.js APIs

Frontend integration:

* Next.js App Router

State management:

* Zustand ONLY

Allowed dependency:

* Zustand

Forbidden dependencies:

* Analytics SDKs
* Mixpanel
* Segment
* Google Analytics
* RxJS
* Lodash
* Math libraries
* Telemetry libraries

All math and event handling must be native TypeScript.

---

# REQUIRED FILE STRUCTURE

Generate the project using EXACTLY this structure:

src/
├─ behaviour/
│
├─ config/
│   └─ behaviourConfig.ts
│
├─ types/
│   ├─ signal.ts
│   ├─ scoring.ts
│   └─ state.ts
│
├─ signals/
│   ├─ ISignalCollector.ts
│   ├─ ActionArrivalCollector.ts
│   ├─ CursorDwellCollector.ts
│   ├─ ScrollReversalCollector.ts
│   └─ ErrorAbandonmentCollector.ts
│
├─ baseline/
│   ├─ RunningStats.ts
│   └─ BaselineManager.ts
│
├─ scoring/
│   ├─ ZScoreEngine.ts
│   └─ CompositeScorer.ts
│
├─ inhibitors/
│   ├─ SelectionInhibitor.ts
│   └─ LatencyInhibitor.ts
│
├─ overrides/
│   └─ OverrideManager.ts
│
├─ stateMachine/
│   └─ BehaviourStateMachine.ts
│
├─ engine/
│   └─ BehaviourEngine.ts
│
├─ store/
│   └─ behaviourStore.ts
│
├─ demo/
│   └─ simulator.ts
│
└─ index.ts

---

# IMPLEMENTATION ORDER

Generate files in this exact order:

1. types
2. config
3. Zustand store
4. signal interfaces
5. collectors
6. running statistics
7. baseline manager
8. z-score engine
9. composite scorer
10. inhibitors
11. override manager
12. state machine
13. engine bootstrap
14. demo simulator
15. README section

Do not skip steps.

---

# SIGNAL COLLECTORS

Every signal collector MUST implement:

```ts
interface ISignalCollector {
  record(...args: unknown[]): void;
  getCurrentValue(): number | null;
  reset(): void;
}
```

Each collector must be independent and pluggable.

Signals:

### 1. Action Arrival Slowing

Track time gaps between:

* click
* keydown

Maintain rolling 60-second window.

Output:

Average inter-action interval.

### 2. Cursor Dwell Duration

Measure:

mouseenter → click

on same target region.

Output:

Average dwell time in milliseconds.

### 3. Scroll Reversal Rate

Track wheel direction changes.

Output:

reversals / totalScrollEvents

### 4. Error/Abandonment Rate

Track:

* invalid events
* beforeunload when task incomplete

Output:

events per rolling window.

---

# BASELINE + Z-SCORE

Maintain per-user in-memory baseline.

No backend persistence required.

Architecture should allow persistence later.

Use:

z = (x - μ) / σ

Requirements:

* Minimum sample count = 30
* Do not emit z-score before 30 samples
* Baseline history size = 500 samples
* Handle σ = 0 safely
* Never emit NaN
* Never emit Infinity

Document every decision.

---

# COMPOSITE SCORING

Every 30 seconds compute:

S_comp = Σ(z_i * w_i) / Σ(w_i)

Only active z-scores participate.

Weights must be configurable.

Default weights:

ACTION_ARRIVAL_WEIGHT = 1.0

CURSOR_DWELL_WEIGHT = 1.2

SCROLL_REVERSAL_WEIGHT = 1.1

ERROR_ABANDONMENT_WEIGHT = 1.8

Clamp final score:

[-3, +3]

Interpretation:

0 = normal

+3 = high cognitive load

-3 = disengagement

---

# MODE MAPPING

Use:

S_comp > 1.8
→ focus

1.2 < S_comp ≤ 1.8
→ clarity

-1.2 ≤ S_comp ≤ 1.2
→ standard

S_comp < -1.2
→ exploration

These mappings must be configurable.

---

# STATE MACHINE

Implement strict validation.

## Two-Signal Rule

Mode transition allowed only if:

At least two independent signals have:

z > 1.0

A single outlier must never trigger transition.

---

## Hysteresis

Enter restrictive mode:

S_comp > 1.8

Return to standard:

S_comp < 1.2

sustained continuously for:

60 seconds

---

## Cooldown

Minimum time between transitions:

120 seconds

except overrides.

---

# INFERENCE INHIBITORS

Pause scoring completely when:

1. Network latency > 500ms
2. User actively selecting text

Resume automatically when conditions clear.

Implement latency measurement using:

fetch("/api/ping")

every 15 seconds.

Make interval configurable.

---

# OVERRIDES

Bypass:

* composite score
* cooldown
* hysteresis

Immediate mode dispatch when:

1. Help panel opened
2. Task abandonment detected
3. Three identical validation errors within two minutes

Use direct state-machine entry path.

---

# ZUSTAND STORE

The engine's ONLY integration surface.

Store shape:

```ts
{
  mode:
    | "standard"
    | "clarity"
    | "focus"
    | "exploration";

  compositeScore: number;

  activeZScores: Record<string, number>;

  trigger:
    | "composite"
    | "override";

  lastTransitionAt: number;
}
```

Engine writes directly to store.

Frontend reads store directly.

No frontend event emitter.

---

# DEMO HARNESS

Create simulator.ts

Must simulate:

1. Rapid clicking
2. Idle periods
3. Long cursor dwell
4. Scroll thrashing
5. Validation errors
6. Override triggers

Console log:

* signal values
* z-scores
* composite score
* mode transitions

so judges can observe behavior.

---

# CODE QUALITY

Requirements:

* Strict TypeScript
* No any types
* TSDoc on public APIs
* Explain thresholds in comments
* Explain formulas in comments
* Explain privacy rationale in comments
* Use composition over inheritance
* Keep classes small and focused

---

# README SECTION

Generate a 3–4 paragraph README section explaining:

1. Privacy-first architecture
2. Signal processing pipeline
3. Cognitive-load scoring model
4. UI morphing state machine

Write for technical hackathon judges.

---

# OUTPUT FORMAT

Before writing code:

1. Review spec
2. Identify ambiguities
3. Ask questions if needed

If no ambiguities remain:

Generate ALL files completely.

Do not use pseudocode.

Do not omit implementations.

Do not write "TODO".

Do not summarize.

Produce full code.
