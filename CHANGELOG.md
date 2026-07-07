# Changelog

## Behaviour Agent Corrections

- Fixed composite state writes so `trigger` now represents the last actual mode dispatch instead of being reset to `"composite"` on every scoring tick.
- Fixed same-mode overrides so they no longer refresh `lastTransitionAt` and accidentally extend composite cooldown without a real mode transition.
- Added internal transition bookkeeping so cooldown remains correct even if a transition occurs at timestamp `0`.
- Initialized transition bookkeeping from the existing Zustand store so recreated engines respect prior transition timestamps.
- Tightened hysteresis so exiting restrictive modes requires the score to stay below the return threshold continuously for the configured duration, including attempted jumps to non-standard modes.
- Hardened score-to-mode mapping against non-finite scores by falling back to `standard`.
- Fixed scroll reversal calculation so stale direction outside the rolling window cannot create a false reversal.
- Hardened baseline history sizing so invalid configurable history sizes cannot create an unbounded loop.
- Fixed latency inhibitor races by preventing overlapping pings and ignoring late async results after stop/restart.
- Reduced override-manager memory growth by pruning old validation-error code entries outside the two-minute repeated-error window.
