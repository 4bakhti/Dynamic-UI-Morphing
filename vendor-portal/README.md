# Vendor Portal · Developing Agent (Code Refactoring Engine)

The onboarding surface for the **Adaptive UI Morphing** framework. A vendor pastes
a raw React/Next.js component plus optional layout guidelines, and the
**Developing Agent** rewrites the file in place — injecting a Zustand state hook,
conditional Tailwind styling, and short-circuit visibility gates for the three
cognitive modes (`FocusMode`, `ExplorationMode`, `ClarityMode`) that the Behaviour
Agent drives at runtime.

## Stack

- **Next.js (App Router)** + React + Tailwind CSS
- **Lucide React** icons, **prism-react-renderer** for code syntax highlighting
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`) with `streamText` for real-time code streaming
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

- `DEMO_MODE=true` — `/api/refactor-ui` streams the **exact** pre-verified
  refactored component (chunked, so it still animates like a live rewrite). Use
  this on stage for a deterministic, bug-free result.
- `DEMO_MODE=false` — real live `gpt-4o-mini` refactor via `streamText`.

The system prompt, demo source, demo guidelines, and canned refactor all live in
[`lib/refactor.ts`](lib/refactor.ts).

## Flow

1. Vendor pastes raw component source + guidelines into the left panel.
2. Clicks **Refactor Component** → `POST /api/refactor-ui`.
3. Server runs `streamText` (or streams the canned code in demo mode).
4. The client reads the text stream and renders the refactored code live in the
   syntax-highlighted right panel.

## Error handling

The route returns clean errors instead of crashing:
- Malformed/non-JSON body → `400`
- Missing `code` → `400`
- Live mode with no `OPENAI_API_KEY` → `500` with a clear setup message
