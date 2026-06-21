"use client";

import { useEffect, useRef, useState } from "react";
import {
  Wand2,
  Copy,
  Check,
  Square,
  FileCode2,
  Code2,
  Terminal,
  RotateCcw,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { DEMO_SOURCE_CODE, DEMO_GUIDELINES } from "@/lib/refactor";

export default function VendorPortalPage() {
  const [code, setCode] = useState(DEMO_SOURCE_CODE);
  const [guidelines, setGuidelines] = useState(DEMO_GUIDELINES);
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Keep the output pane scrolled to the newest streamed line.
  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output]);

  const handleRefactor = async () => {
    setError(null);
    setCopied(false);
    setOutput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/refactor-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, guidelines }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setOutput(accumulated);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message || "Refactor failed.");
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => abortRef.current?.abort();

  const handleCopy = async () => {
    if (!output || !navigator.clipboard) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const resetDemo = () => {
    setCode(DEMO_SOURCE_CODE);
    setGuidelines(DEMO_GUIDELINES);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-6 py-6">
      <Header />

      <div className="mt-6 grid flex-1 grid-cols-1 gap-5 lg:grid-cols-2">
        {/* ---------- LEFT: inputs ---------- */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-ink-700/70 bg-ink-900/60 backdrop-blur">
          <PaneHeader
            icon={<Code2 className="h-4 w-4 text-accent" />}
            title="Source Component"
            subtitle="Paste a raw React / TypeScript file"
          />

          <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              placeholder="Paste your component source here…"
              className="min-h-[16rem] flex-1 resize-none rounded-xl border border-ink-700 bg-ink-950/80 p-4 font-mono text-[13px] leading-relaxed text-slate-200 outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
            />

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <Wand2 className="h-3.5 w-3.5" />
                Layout Guidelines
                <span className="font-normal normal-case tracking-normal text-slate-600">
                  (optional)
                </span>
              </label>
              <textarea
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
                spellCheck={false}
                placeholder="e.g. Keep the editor primary; charts are lowest priority…"
                className="h-24 w-full resize-none rounded-xl border border-ink-700 bg-ink-950/80 p-3 text-sm text-slate-200 outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={isLoading ? handleStop : handleRefactor}
                disabled={!code.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-accent-glow disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <Square className="h-4 w-4 fill-current" />
                    Stop
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Refactor Component
                  </>
                )}
              </button>
              <button
                onClick={resetDemo}
                className="inline-flex items-center gap-2 rounded-xl border border-ink-700 px-4 py-3 text-sm text-slate-400 transition hover:text-slate-200"
              >
                <RotateCcw className="h-4 w-4" />
                Reset demo
              </button>
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}
          </div>
        </section>

        {/* ---------- RIGHT: refactored output ---------- */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-ink-700/70 bg-ink-950/80 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-ink-700/70 bg-ink-900/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              <span className="ml-3 inline-flex items-center gap-1.5 font-mono text-xs text-slate-500">
                <FileCode2 className="h-3.5 w-3.5" />
                Dashboard.tsx · refactored
              </span>
            </div>
            <button
              onClick={handleCopy}
              disabled={!output}
              className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 px-3 py-1 text-xs text-slate-400 transition hover:text-slate-200 disabled:opacity-30"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>

          <div
            ref={outputRef}
            className="thin-scroll min-h-[34rem] flex-1 overflow-auto p-5"
          >
            {output ? (
              <div className="animate-fade-in">
                <CodeBlock code={output} />
                {isLoading && (
                  <span className="ml-0.5 inline-block h-4 w-2 animate-blink bg-accent align-middle" />
                )}
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
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/40">
          <Terminal className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            Adaptive UI · Code Refactoring Engine
          </h1>
          <p className="text-sm text-slate-400">
            The Developing Agent rewrites your components for cognitive-state morphing
          </p>
        </div>
      </div>
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-ink-700 bg-ink-900/60 px-3 py-1 text-xs text-slate-400">
        <span className="h-2 w-2 animate-blink rounded-full bg-emerald-400" />
        Developing Agent online
      </span>
    </header>
  );
}

function PaneHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-ink-700/70 bg-ink-900/40 px-4 py-3">
      {icon}
      <span className="text-sm font-semibold text-slate-200">{title}</span>
      <span className="text-xs text-slate-500">· {subtitle}</span>
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <pre className="font-mono text-sm text-slate-600">
        {loading ? "▌ analyzing component…" : "// refactored component will stream here"}
      </pre>
      {!loading && (
        <p className="mt-2 max-w-xs text-xs text-slate-600">
          Paste a component and hit Refactor — the agent injects state listeners,
          conditional Tailwind, and visibility gates for the three modes.
        </p>
      )}
    </div>
  );
}
