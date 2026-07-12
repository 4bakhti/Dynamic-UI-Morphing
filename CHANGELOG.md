# Changelog

## Security Hardening (2026-07-12)

- Added a global (all-clients) sliding-window budget to the vendor-portal LLM rate limiter. The per-IP key comes from `x-forwarded-for`, which anyone reaching the origin directly can rotate per request to mint fresh per-IP budgets; the global cap bounds total LLM spend and the limiter's memory regardless of spoofed IPs.
- Upgraded both apps from Next.js 14.2.35 to 15.5.20 (React 19), clearing all 14 open Next.js security advisories (RSC denial-of-service, App Router XSS, cache poisoning, request smuggling, and others).
- Upgraded vendor-portal from AI SDK 4 to 6 (`ai@6`, `@ai-sdk/openai@3`), clearing the `@ai-sdk/provider-utils` uncontrolled-resource-consumption and `jsondiffpatch` XSS advisories; `streamText`'s `maxTokens` option became `maxOutputTokens`.
- Pinned `postcss` to ≥ 8.5.10 via npm overrides in both apps so Next.js's vendored copy no longer carries the stringify-XSS advisory. `npm audit` is now clean in all three workspaces.

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
