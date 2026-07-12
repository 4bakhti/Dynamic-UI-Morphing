# Vendor Portal · Developing Agent

The onboarding surface for the **Adaptive UI Morphing** framework. The
**Developing Agent** has two modes, switchable from the tabs at the top of the
page:

1. **Refactor Code** — a vendor pastes a raw React/Next.js component plus
   optional layout guidelines, and the agent rewrites the file in place:
   injecting a Zustand state hook, conditional Tailwind styling, and
   short-circuit visibility gates for the three cognitive modes (`FocusMode`,
   `ExplorationMode`, `ClarityMode`) that the Behaviour Agent drives at runtime.
2. **Layout JSON** — a vendor describes their app's components in plain text,
   and the agent emits a **Zod-validated JSON layout config** for the three
   modes. The schema constrains every component name and field, so the model
   structurally cannot emit a config the consuming frontend fails to parse. The
   output imports directly into the Live Demo App (header → **Import layout**).

## Stack

- **Next.js (App Router)** + React + Tailwind CSS
- **Lucide React** icons, **prism-react-renderer** for code syntax highlighting
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`): `streamText` for code refactoring,
  `streamObject` + **Zod** for schema-validated layout JSON
- Model: `gpt-4o-mini`

## Setup

```bash
cd vendor-portal
npm install
# add your key + mode to .env.local (OPENAI_API_KEY, DEMO_MODE)
npm run dev
```

Open http://localhost:3000.

## Demo safety net

`.env.local` controls `DEMO_MODE`:

- `DEMO_MODE=true` — both routes stream **exact** pre-verified output (chunked,
  so it still animates like a live generation). Use this on stage for a
  deterministic, bug-free result. No API key needed.
- `DEMO_MODE=false` — real live `gpt-4o-mini` calls.

The refactor prompt, demo source, and canned refactor live in
[`lib/refactor.ts`](lib/refactor.ts); the layout schema, prompt, and canned
config live in [`lib/schema.ts`](lib/schema.ts).

## Flow

1. Vendor picks a mode, pastes source code (Refactor) or an app description
   (Layout JSON), plus optional guidelines.
2. Clicks the action button → `POST /api/refactor-ui` or `POST /api/generate-layout`.
3. Server runs `streamText` / `streamObject` (or streams the canned output in
   demo mode).
4. The client reads the text stream and renders the result live in the
   syntax-highlighted right panel. Layout JSON can then be copied into the demo
   app's **Import layout** panel.

## Request guards

Both routes are hardened against abuse and prompt injection
([`lib/apiGuards.ts`](lib/apiGuards.ts)):

- Malformed/non-JSON body → `400`; missing required field → `400`
- Oversized input (code 40k chars, description 8k, guidelines 4k) → `413`
- Per-IP sliding-window rate limit on the paid LLM path → `429`, backed by a
  global all-clients budget so rotating spoofed `x-forwarded-for` values cannot
  mint fresh per-IP allowances
- Output capped at 4,096 tokens per refactor response
- Pasted code/descriptions are wrapped in untrusted-data delimiters, and the
  system prompt is instructed to ignore embedded instructions
- Live mode with no `OPENAI_API_KEY` → `500` with a clear setup message
