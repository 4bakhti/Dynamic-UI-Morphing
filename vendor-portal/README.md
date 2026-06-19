# Vendor Portal · Developing Agent

The onboarding surface for the **Adaptive UI Morphing** framework. A software
vendor describes their app's React components, and the **Developing Agent** (an
LLM) generates a strict JSON config defining three cognitive-state layouts
(`FocusMode`, `ExplorationMode`, `ClarityMode`) that the Behaviour Agent switches
between at runtime.

## Stack

- **Next.js (App Router)** + React + Tailwind CSS
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`) with `streamObject` + a **Zod** schema
  → the LLM physically cannot emit JSON that breaks the consuming frontend.
- Model: `gpt-4o-mini`

## Setup

```bash
cd vendor-portal
npm install
cp .env.local.example .env.local   # then add your OPENAI_API_KEY
npm run dev
```

Open http://localhost:3000.

## Demo safety net

`.env.local` controls `DEMO_MODE`:

- `DEMO_MODE=true` — the `/api/generate-layout` route streams the **exact**
  pre-compiled JSON (chunked, so it still animates like a live generation). Use
  this on stage so the output deterministically matches Abdurahmon's running app.
- `DEMO_MODE=false` — real live OpenAI call via `streamObject`.

The canned output and the demo input prompt both live in [`lib/schema.ts`](lib/schema.ts).

## Flow

1. Vendor pastes a component description into the textarea.
2. Clicks **Generate Adaptive Layouts** → `POST /api/generate-layout`.
3. Server runs `streamObject` (or streams the canned JSON in demo mode).
4. The client (`experimental_useObject`) renders the partial JSON live in the
   terminal-style, syntax-highlighted output window.
