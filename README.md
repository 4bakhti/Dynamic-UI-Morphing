# Dynamic UI Morphing Framework

**Interfaces that adapt to how a person is actually doing — not just what they clicked.**

A B2B framework that watches *how* users move through software (never *what* they type or read) and reshapes the interface in real time: stripping away noise when they're focused, surfacing help when they're stuck, and simplifying everything when they're frustrated. A human-controlled lock switch always wins over the algorithm.

<p>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white">
  <img alt="Zustand" src="https://img.shields.io/badge/State-Zustand-7c3aed?style=flat">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white">
  <img alt="Framer Motion" src="https://img.shields.io/badge/Framer_Motion-0055FF?style=flat&logo=framer&logoColor=white">
  <img alt="OpenAI" src="https://img.shields.io/badge/LLM-gpt--4o--mini-412991?style=flat&logo=openai&logoColor=white">
  <img alt="Privacy" src="https://img.shields.io/badge/Telemetry-numeric--only-22c55e?style=flat">
</p>

---

## The pitch

Most "smart" UIs react to clicks. This one reacts to *cognitive load* — measured from timing, dwell, scroll reversals, and error rates, never from content. Three pieces work together to make that real instead of theoretical:

```
1 · DESCRIBE                    2 · WATCH & SCORE               3 · MORPH                   
+--------------------------+    +--------------------------+    +--------------------------+
| Vendor Portal            |    | Behaviour Agent          |    | Live Demo App            |
| vendor-portal/           |--> | src/behaviour/           |--> | demo-app/                |
|                          |    |                          |    |                          |
| An LLM turns a           |    | Numeric-only telemetry   |    | Sidebar, Ribbon, Chart,  |
| plain-text component     |    | to per-signal z-scores   |    | Editor, Notifications    |
| list into layout JSON    |    | to composite score to    |    | all read from one mode   |
| for Focus / Exploration  |    | state machine, guarded   |    | in Zustand and morph     |
| / Clarity modes          |    | by cooldown + hysteresis |    | live with Framer Motion  |
+--------------------------+    +--------------------------+    +--------------------------+
```

## The four modes

| Mode | Trigger | What changes |
|---|---|---|
| **Normal** | Default state | Everything visible: sidebar, metrics, chart, editor, notifications |
| **Focus** | Attention drops / high mouse velocity | Every peripheral panel hides; the report editor expands into a centered, minimalist writing canvas |
| **Exploration** | User looks stuck or idle | Charts and notifications hide; sidebar + editor stay; a gentle AI helper tooltip fades in on the component they're stuck on |
| **Clarity** | Fatigue, rage-clicks, repeated errors | Dense feeds and multi-series charts hide; click targets enlarge; text gets bolder and bigger; navigation simplifies |

Every mode transition is debounced — a single noisy signal can't morph the UI. And no matter what the algorithm decides, a **"Lock Interface" toggle** gives the human the last word: while locked, background mode-change signals are silently ignored.

## Privacy by construction

The Behaviour Agent only ever touches numbers:

- **Observed:** event timing, intervals, frequencies, mouse coordinates, position deltas, scroll direction, counts, bounding boxes
- **Never observed:** keystroke content, form values, clipboard data, DOM text, screenshots, selectors, labels, semantic page content

This isn't a policy promise enforced by review — the collectors in [`src/behaviour/signals/`](src/behaviour/signals/) are physically incapable of reading anything else; there's no code path that touches text content at all.

## The three pieces

### Behaviour Agent — [`src/behaviour/`](src/behaviour/)

A privacy-first browser telemetry engine. Four pluggable signal collectors (action-arrival slowing, cursor dwell, scroll reversal, error/abandonment) feed an in-memory per-user baseline (500-sample history, z-scores withheld until 30 samples to avoid cold-start noise). Every 30 seconds those z-scores combine into a composite score, `S_comp = Σ(zᵢ·wᵢ) / Σwᵢ`, clamped to `[-3, +3]`. A state machine maps that score to a mode through configurable thresholds, gated by cooldown, hysteresis, and a two-signal rule — while explicit overrides (help panel opened, task abandoned, repeated validation errors) bypass those guards and dispatch immediately. Everything is exposed through a single Zustand store the frontend reads directly.

### Vendor Portal (Developing Agent) — [`vendor-portal/`](vendor-portal/)

A Next.js onboarding surface with two agent modes. **Layout JSON**: a vendor pastes a plain-text description of their app's components and an LLM (`gpt-4o-mini` via the Vercel AI SDK's `streamObject`) generates a strict, Zod-validated JSON config defining the `FocusMode`, `ExplorationMode`, and `ClarityMode` layouts — the schema constrains every component name and field, so the model structurally cannot emit a config the consuming frontend fails to parse. **Refactor Code**: the agent ingests the vendor's raw component source and rewrites it in place with mode-aware conditional rendering (via `streamText`). Both routes share hardened request guards — input size caps, per-IP rate limiting on the paid path, capped output tokens, and untrusted-data delimiters against prompt injection. A `DEMO_MODE` flag swaps the live calls for deterministic pre-compiled responses, so on-stage demos never depend on model variance or network conditions. See [`vendor-portal/README.md`](vendor-portal/README.md).

### Live Demo App — [`demo-app/`](demo-app/)

The "Enterprise Data Analytics Dashboard" judges actually see: a single-page Next.js app with a sidebar, a metrics ribbon, a data chart, a report editor, and a notification feed, all driven by one `currentMode` value in a Zustand store. Framer Motion animates every panel hiding, expanding, or reflowing as the mode changes. The layout rules for each mode live in one file — [`lib/layoutConfig.ts`](demo-app/lib/layoutConfig.ts) — mirroring the exact contract the Developing Agent emits, so the two apps can never disagree about what a mode looks like. The header's **Import layout** panel closes the loop: paste the JSON the Vendor Portal generated and the dashboard morphs using that vendor's config instead of the built-in one. The "Simulate Signal" pills stand in for the real Behaviour Agent during a demo; the **Lock Interface** switch next to them proves the human-in-the-loop safeguard live.

## Getting started

```bash
# Behaviour Agent — library, no dev server
npm install
npm test        # vitest suite: scoring, baselines, state-machine guards
npm run typecheck

# Vendor Portal (Developing Agent) — needs an OpenAI key, or DEMO_MODE=true
cd vendor-portal
npm install
cp .env.local.example .env.local   # fill in OPENAI_API_KEY, or set DEMO_MODE=true
npm run dev   # http://localhost:3000

# Live Demo App — fully self-contained, no env vars needed
cd demo-app
npm install
npm run dev   # http://localhost:3000
```

## Project structure

```
.
├── src/behaviour/        # Behaviour Agent: signals → baselines → z-scores → state machine
│   ├── signals/           # Pluggable numeric-only collectors
│   ├── baseline/          # Per-signal running mean/stddev
│   ├── scoring/            # Z-score + composite scoring
│   ├── stateMachine/        # Mode transitions: cooldown, hysteresis, two-signal rule
│   ├── overrides/            # Explicit bypass triggers (help panel, abandonment, errors)
│   └── store/                  # The Zustand store the frontend reads
│
├── vendor-portal/        # Developing Agent: LLM → refactored code or layout JSON
│   ├── app/api/generate-layout/  # streamObject route: Zod-validated layout JSON
│   ├── app/api/refactor-ui/       # streamText route: mode-aware code rewrite
│   ├── lib/schema.ts               # The Zod contract + canned demo output
│   ├── lib/refactor.ts              # Refactor prompts + canned demo refactor
│   └── lib/apiGuards.ts              # Size caps, rate limiting, shared route guards
│
└── demo-app/              # Live Demo: the dashboard judges see, morphing in real time
    ├── lib/layoutConfig.ts  # Single source of truth for visibility/overrides per mode
    ├── lib/store.ts            # currentMode + isInterfaceLocked + imported layouts
    └── components/              # Sidebar, Ribbon, Chart, Editor, Feed, Helper, Header
```

## Team

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/4bakhti">
        <img src="https://github.com/4bakhti.png?size=120" width="100" alt="Bakhtier Abdullaev" /><br />
        <strong>Bakhtier Abdullaev</strong>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/asfandyar-prog">
        <img src="https://github.com/asfandyar-prog.png?size=120" width="100" alt="Asfand Yar" /><br />
        <strong>Asfand Yar</strong>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/yigitcemakbas">
        <img src="https://github.com/yigitcemakbas.png?size=120" width="100" alt="Yigit Akbas" /><br />
        <strong>Yigit Akbas</strong>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Inam-kakar">
        <img src="https://github.com/Inam-kakar.png?size=120" width="100" alt="Inam Ullah" /><br />
        <strong>Inam Ullah</strong>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/justkuchkorov">
        <img src="https://github.com/justkuchkorov.png?size=120" width="100" alt="Abdurakhmon Kuchkorov" /><br />
        <strong>Abdurakhmon Kuchkorov</strong>
      </a>
    </td>
  </tr>
</table>
