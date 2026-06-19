"use client";

import { experimental_useObject as useObject } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { layoutSchema, DEMO_PROMPT } from "@/lib/schema";
import { JsonHighlight } from "@/components/JsonHighlight";

export default function VendorPortalPage() {
  const [prompt, setPrompt] = useState(DEMO_PROMPT);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/generate-layout",
    schema: layoutSchema,
  });

  const jsonText = object ? JSON.stringify(object, null, 2) : "";

  // Keep the terminal scrolled to the newest streamed line.
  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [jsonText]);

  const handleGenerate = () => {
    setCopied(false);
    submit({ prompt });
  };

  const handleCopy = async () => {
    if (!jsonText) return;
    await navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
      <Header />

      <div className="mt-8 grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ---- Input panel ---- */}
        <section className="flex flex-col rounded-2xl border border-ink-700/70 bg-ink-900/60 p-6 backdrop-blur">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Application Structure
          </label>
          <p className="mt-2 text-sm text-slate-400">
            Describe the core React components that make up your interface. The
            Developing Agent maps them into adaptive cognitive states.
          </p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            spellCheck={false}
            placeholder="My app has a <SidebarNavigation>, <MainDataChart>, ..."
            className="mt-4 h-56 w-full resize-none rounded-xl border border-ink-700 bg-ink-950/80 p-4 font-mono text-sm text-slate-200 outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
          />

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={isLoading ? stop : handleGenerate}
              disabled={!prompt.trim()}
              className="group relative inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-accent-glow disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Generating…
                </>
              ) : (
                <>
                  <BoltIcon />
                  Generate Adaptive Layouts
                </>
              )}
            </button>
            <button
              onClick={() => setPrompt(DEMO_PROMPT)}
              className="rounded-xl border border-ink-700 px-4 py-3 text-sm text-slate-400 transition hover:text-slate-200"
            >
              Reset demo prompt
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error.message || "Generation failed. Check the server logs."}
            </p>
          )}

          <ModeLegend />
        </section>

        {/* ---- Terminal output panel ---- */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-ink-700/70 bg-ink-950/80 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-ink-700/70 bg-ink-900/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              <span className="ml-3 font-mono text-xs text-slate-500">
                developing-agent · layout.config.json
              </span>
            </div>
            <button
              onClick={handleCopy}
              disabled={!jsonText}
              className="rounded-md border border-ink-700 px-3 py-1 text-xs text-slate-400 transition hover:text-slate-200 disabled:opacity-30"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>

          <div
            ref={outputRef}
            className="thin-scroll min-h-[28rem] flex-1 overflow-auto p-5"
          >
            {jsonText ? (
              <div className="animate-fade-in">
                <JsonHighlight value={jsonText} />
                {isLoading && <span className="ml-0.5 inline-block h-4 w-2 animate-blink bg-accent align-middle" />}
              </div>
            ) : (
              <EmptyState loading={isLoading} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/40">
            <BoltIcon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Adaptive UI · Vendor Portal
            </h1>
            <p className="text-sm text-slate-400">
              Onboard your app into the cognitive-load framework
            </p>
          </div>
        </div>
      </div>
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-ink-700 bg-ink-900/60 px-3 py-1 text-xs text-slate-400">
        <span className="h-2 w-2 animate-blink rounded-full bg-emerald-400" />
        Developing Agent online
      </span>
    </header>
  );
}

function ModeLegend() {
  const modes = [
    { name: "FocusMode", desc: "High mouse velocity → strip peripheral noise", dot: "bg-sky-400" },
    { name: "ExplorationMode", desc: "Idle dwell → surface contextual help", dot: "bg-emerald-400" },
    { name: "ClarityMode", desc: "Rage-clicks → enlarge targets, simplify nav", dot: "bg-fuchsia-400" },
  ];
  return (
    <div className="mt-auto space-y-3 pt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Output states
      </p>
      {modes.map((m) => (
        <div key={m.name} className="flex items-start gap-3">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.dot}`} />
          <div>
            <span className="font-mono text-sm text-slate-200">{m.name}</span>
            <p className="text-xs text-slate-500">{m.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <pre className="font-mono text-sm text-slate-600">
        {loading ? "▌ awaiting first token…" : "// JSON configuration will stream here"}
      </pre>
      {!loading && (
        <p className="mt-2 max-w-xs text-xs text-slate-600">
          Describe your components and run the Developing Agent to generate the
          three cognitive-state layouts.
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function BoltIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8z" />
    </svg>
  );
}
