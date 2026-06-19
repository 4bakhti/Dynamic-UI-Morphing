# Dynamic UI Morphing Framework

## Behaviour Agent

The Behaviour Agent is a privacy-first browser telemetry engine for adaptive interfaces. It deliberately observes only numeric interaction metadata: event timing, frequencies, intervals, mouse coordinates, position deltas, scroll direction, counts, and bounding boxes. It never reads keystroke content, form values, clipboard contents, DOM text, screenshots, selectors, labels, or semantic page data, which keeps the scoring pipeline free of personal content by construction.

Signals flow through small pluggable collectors under `src/behaviour/signals`. Action arrival slowing tracks click/keydown intervals, cursor dwell measures mouseenter-to-click duration on the same numeric region, scroll reversal tracks wheel direction changes, and error/abandonment counts invalid and incomplete-exit events. Each signal feeds an in-memory per-user baseline with a 500-sample history and emits z-scores only after 30 samples, preventing cold-start noise from driving UI changes.

The cognitive-load score is computed every 30 seconds as a weighted average of active z-scores: `S_comp = sum(z_i * w_i) / sum(w_i)`, clamped to `[-3, +3]`. Missing z-scores are excluded rather than treated as normal, and all math guards against `NaN`, `Infinity`, and zero standard deviation. Network latency above 500ms and active text selection pause scoring so external system conditions and intentional selection behavior are not mistaken for cognitive load.

The UI morphing state machine maps scores to `standard`, `clarity`, `focus`, and `exploration` modes through configurable thresholds. Composite transitions are validated with cooldown, hysteresis, and a two-signal rule so a single outlier cannot morph the UI. Explicit overrides such as help-panel opens, task abandonment, and repeated numeric validation errors bypass those safeguards and dispatch immediately through the same Zustand store that the Next.js frontend reads.
