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
  FileJson2,
  KeyRound,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { DEMO_SOURCE_CODE, DEMO_GUIDELINES } from "@/lib/refactor";
import { DEMO_APP_DESCRIPTION } from "@/lib/schema";

type AgentMode = "refactor" | "layout";

const MODE_COPY: Record<
  AgentMode,
  {
    tab: string;
    inputTitle: string;
    inputSubtitle: string;
    inputPlaceholder: string;
    action: string;
    outputFile: string;
    outputLanguage: "tsx" | "json";
    emptyHint: string;
  }
> = {
  refactor: {
    tab: "Refactor Code",
    inputTitle: "Source Component",
    inputSubtitle: "Paste a raw React / TypeScript file",
    inputPlaceholder: "Paste your component source here…",
    action: "Refactor Component",
    outputFile: "Dashboard.tsx · refactored",
    outputLanguage: "tsx",
    emptyHint:
      "Paste a component and hit Refactor — the agent injects state listeners, conditional Tailwind, and visibility gates for the three modes.",
  },
  layout: {
    tab: "Layout JSON",
    inputTitle: "App Description",
    inputSubtitle: "Describe your app's components in plain text",
    inputPlaceholder: "Describe your dashboard's components and their priorities…",
    action: "Generate Layout",
    outputFile: "layout-config.json · generated",
    outputLanguage: "json",
    emptyHint:
      "Describe your app and hit Generate — the agent emits a schema-validated JSON config you can import straight into the Live Demo App (header → Import layout).",
  },
};

export default function VendorPortalPage() {
  const [agentMode, setAgentMode] = useState<AgentMode>("refactor");
  const [code, setCode] = useState(DEMO_SOURCE_CODE);
  const [description, setDescription] = useState(DEMO_APP_DESCRIPTION);
  const [guidelines, setGuidelines] = useState(DEMO_GUIDELINES);
  const [accessCode, setAccessCode] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Only needed when the server sets PORTAL_ACCESS_CODE; persisted so an
  // authorized operator types it once. Hydrated post-mount to avoid an SSR
  // mismatch, since localStorage is not available on the server.
  useEffect(() => {
    const saved = localStorage.getItem("vendor-portal:access-code");
    if (saved) setAccessCode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("vendor-portal:access-code", accessCode);
  }, [accessCode]);

  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const copy = MODE_COPY[agentMode];
  const input = agentMode === "refactor" ? code : description;
  const setInput = agentMode === "refactor" ? setCode : setDescription;

  // Keep the output pane scrolled to the newest streamed line.
  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output]);

  const switchMode = (mode: AgentMode) => {
    if (mode === agentMode) return;
    abortRef.current?.abort();
    setAgentMode(mode);
    setOutput("");
    setError(null);
    setCopied(false);
  };

  const handleGenerate = async () => {
    setError(null);
    setCopied(false);
    setOutput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const endpoint = agentMode === "refactor" ? "/api/refactor-ui" : "/api/generate-layout";
    const payload =
      agentMode === "refactor" ? { code, guidelines } : { description, guidelines };

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // Only sent when the operator has entered a code; the endpoint ignores it
    // unless PORTAL_ACCESS_CODE is configured server-side.
    if (accessCode.trim()) headers["x-portal-access-code"] = accessCode.trim();

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
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
        setError((e as Error).message || "Generation failed.");
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
    setDescription(DEMO_APP_DESCRIPTION);
    setGuidelines(DEMO_GUIDELINES);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-6 py-6">
      <Header />

      <div className="mt-6 flex items-center gap-2">
        <ModeTab
          icon={<Code2 className="h-4 w-4" />}
          label={MODE_COPY.refactor.tab}
          active={agentMode === "refactor"}
          onClick={() => switchMode("refactor")}
        />
        <ModeTab
          icon={<FileJson2 className="h-4 w-4" />}
          label={MODE_COPY.layout.tab}
          active={agentMode === "layout"}
          onClick={() => switchMode("layout")}
        />
        <span className="ml-2 text-xs text-slate-500">
          {agentMode === "refactor"
            ? "Rewrites your component source with mode-aware rendering"
            : "Emits schema-validated layout JSON the Live Demo App imports directly"}
        </span>
      </div>

      <div className="mt-4 grid flex-1 grid-cols-1 gap-5 lg:grid-cols-2">
        {/* ---------- LEFT: inputs ---------- */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-ink-700/70 bg-ink-900/60 backdrop-blur">
          <PaneHeader
            icon={<Code2 className="h-4 w-4 text-accent" />}
            title={copy.inputTitle}
            subtitle={copy.inputSubtitle}
          />

          <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              placeholder={copy.inputPlaceholder}
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

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <KeyRound className="h-3.5 w-3.5" />
                Access Code
                <span className="font-normal normal-case tracking-normal text-slate-600">
                  (only if the portal requires one)
                </span>
              </label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                placeholder="Leave blank for the open demo"
                className="w-full rounded-xl border border-ink-700 bg-ink-950/80 p-3 text-sm text-slate-200 outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={isLoading ? handleStop : handleGenerate}
                disabled={!input.trim()}
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
                    {copy.action}
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

        {/* ---------- RIGHT: generated output ---------- */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-ink-700/70 bg-ink-950/80 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-ink-700/70 bg-ink-900/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              <span className="ml-3 inline-flex items-center gap-1.5 font-mono text-xs text-slate-500">
                <FileCode2 className="h-3.5 w-3.5" />
                {copy.outputFile}
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
                <CodeBlock code={output} language={copy.outputLanguage} />
                {isLoading && (
                  <span className="ml-0.5 inline-block h-4 w-2 animate-blink bg-accent align-middle" />
                )}
              </div>
            ) : (
              <EmptyState loading={isLoading} hint={copy.emptyHint} />
            )}
          </div>

          {agentMode === "layout" && output && !isLoading && (
            <p className="border-t border-ink-700/70 bg-ink-900/40 px-4 py-2.5 text-xs text-slate-500">
              Copy this JSON, then in the Live Demo App open the header&apos;s{" "}
              <span className="text-slate-300">Import layout</span> panel and paste it —
              the dashboard morphs using your config.
            </p>
          )}
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
            Adaptive UI · Developing Agent
          </h1>
          <p className="text-sm text-slate-400">
            Refactors your components — or emits layout JSON — for cognitive-state morphing
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

function ModeTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-accent/60 bg-accent/10 text-accent"
          : "border-ink-700 text-slate-400 hover:text-slate-200"
      }`}
    >
      {icon}
      {label}
    </button>
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

function EmptyState({ loading, hint }: { loading: boolean; hint: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <pre className="font-mono text-sm text-slate-600">
        {loading ? "▌ analyzing input…" : "// generated output will stream here"}
      </pre>
      {!loading && <p className="mt-2 max-w-xs text-xs text-slate-600">{hint}</p>}
    </div>
  );
}
