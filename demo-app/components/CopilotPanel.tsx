"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Anchor,
  BadgeCheck,
  Bot,
  Brain,
  Coins,
  ExternalLink,
  Hand,
  Link2,
  Loader2,
  Lock,
  ShieldBan,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { useDashboardStore } from "@/lib/store";
import { summarizeLedger, type LedgerEntry } from "@/lib/ledger";
import { MODE_THEME } from "@/lib/modeTheme";
import {
  MODE_ANNOUNCEMENTS,
  anchorLedger,
  loadIntegrations,
  readAnchoredMemo,
  requestAirdrop,
  requestInsight,
  speak,
  useCopilotStore,
  type InsightResult,
} from "@/lib/copilot";
import { StatusPill } from "./ui/Badge";
import { Switch } from "./ui/Switch";
import { cn } from "@/lib/utils";

interface WalletStatus {
  configured: boolean;
  cluster: string;
  address?: string;
  addressUrl?: string;
  balance?: number | null;
  error?: string | null;
}

export function CopilotPanel() {
  const open = useCopilotStore((s) => s.open);
  const setOpen = useCopilotStore((s) => s.setOpen);

  useEffect(() => {
    void loadIntegrations();
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="copilot"
          initial={{ x: 440, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 440, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed bottom-3 right-3 top-3 z-40 flex w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink text-slate-200 shadow-2xl"
          aria-label="Adaptive copilot"
        >
          <div className="relative overflow-hidden border-b border-white/10 px-5 pb-4 pt-5">
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="flex items-center gap-2 text-base font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-violet-300" /> Adaptive Copilot
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Gemini explains · ElevenLabs speaks · Solana remembers
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close copilot"
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="dark-scroll flex-1 space-y-4 overflow-y-auto p-4">
            <GeminiSection />
            <VoiceSection />
            <LedgerSection />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Section({
  icon,
  title,
  sponsor,
  status,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sponsor: string;
  status: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon}
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-[11px] text-slate-500">{sponsor}</p>
          </div>
        </div>
        {status}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function GeminiSection() {
  const integrations = useCopilotStore((s) => s.integrations);
  const currentMode = useDashboardStore((s) => s.currentMode);
  const [result, setResult] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    setLoading(true);
    try {
      setResult(await requestInsight("explain"));
    } catch (error) {
      setResult({ text: error instanceof Error ? error.message : "Request failed.", source: "fallback" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section
      icon={
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-500">
          <Brain className="h-4 w-4 text-white" />
        </span>
      }
      title="Why does my screen look like this?"
      sponsor={`Google Gemini${integrations ? ` · ${integrations.gemini.model}` : ""}`}
      status={<StatusPill live={integrations ? integrations.gemini.live : null} />}
    >
      <p className="text-xs leading-relaxed text-slate-400">
        Gemini sees only numbers — the mode, the composite load score and signal counts — and explains the
        current layout in plain language. It also drafts report outlines and writes the Exploration-mode
        nudges.
      </p>
      <button
        onClick={explain}
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:bg-slate-100 disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        Explain {MODE_THEME[currentMode].label} mode
      </button>
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.text}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3"
          >
            <p className="text-[13px] leading-relaxed text-slate-200">{result.text}</p>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>{result.source === "gemini" ? "Generated by Gemini" : "Offline template"}</span>
              <button
                onClick={() => void speak(result.text)}
                className="flex items-center gap-1 text-slate-400 transition hover:text-white"
              >
                <Volume2 className="h-3 w-3" /> Speak it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

function VoiceSection() {
  const integrations = useCopilotStore((s) => s.integrations);
  const announceModes = useCopilotStore((s) => s.announceModes);
  const toggleAnnounce = useCopilotStore((s) => s.toggleAnnounce);
  const speaking = useCopilotStore((s) => s.speaking);
  const lastVoiceSource = useCopilotStore((s) => s.lastVoiceSource);
  const voiceError = useCopilotStore((s) => s.voiceError);
  const currentMode = useDashboardStore((s) => s.currentMode);

  return (
    <Section
      icon={
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-200 to-white">
          <Volume2 className="h-4 w-4 text-ink" />
        </span>
      }
      title="Voice that adapts with you"
      sponsor={`ElevenLabs${integrations ? ` · ${integrations.elevenlabs.model}` : ""}`}
      status={<StatusPill live={integrations ? integrations.elevenlabs.live : null} offLabel="Browser voice" />}
    >
      <p className="text-xs leading-relaxed text-slate-400">
        When the UI morphs, a calm voice tells the user what changed and why — so a sudden layout shift never
        feels like a glitch. In Clarity mode, fatigued users can have their report read back to them.
      </p>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
        <span className="text-xs font-medium text-slate-200">Announce mode changes</span>
        <Switch checked={announceModes} onCheckedChange={toggleAnnounce} label="Announce mode changes" />
      </div>
      <button
        onClick={() => void speak(MODE_ANNOUNCEMENTS[currentMode])}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
      >
        {speaking ? (
          <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
            {[0, 1, 2, 3].map((bar) => (
              <span
                key={bar}
                className="w-[3px] origin-bottom animate-equalize rounded-full bg-violet-300"
                style={{ height: "100%", animationDelay: `${bar * 0.12}s` }}
              />
            ))}
          </span>
        ) : (
          <Volume2 className="h-3.5 w-3.5" />
        )}
        Preview the {currentMode} announcement
      </button>
      {lastVoiceSource && (
        <p className="mt-2 text-[10px] text-slate-500">
          Last spoken by {lastVoiceSource === "elevenlabs" ? "ElevenLabs" : "the browser's built-in voice"}
          {lastVoiceSource === "browser" && voiceError ? ` — ${voiceError}` : ""}
        </p>
      )}
    </Section>
  );
}

const EVENT_META: Record<LedgerEntry["event"], { label: string; icon: React.ReactNode }> = {
  mode: { label: "Morph", icon: <Bot className="h-3 w-3" /> },
  blocked: { label: "Blocked", icon: <ShieldBan className="h-3 w-3" /> },
  lock: { label: "Locked", icon: <Lock className="h-3 w-3" /> },
  unlock: { label: "Unlocked", icon: <Lock className="h-3 w-3" /> },
};

function LedgerSection() {
  const ledger = useDashboardStore((s) => s.ledger);
  const anchors = useCopilotStore((s) => s.anchors);
  const integrations = useCopilotStore((s) => s.integrations);
  const [wallet, setWallet] = useState<WalletStatus | null>(null);
  const [busy, setBusy] = useState<"anchor" | "airdrop" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [readBack, setReadBack] = useState<Record<string, string>>({});
  const summary = summarizeLedger(ledger);

  const refreshWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/ledger", { cache: "no-store" });
      if (res.ok) setWallet((await res.json()) as WalletStatus);
    } catch {
      // Offline — anchoring falls back to a local digest.
    }
  }, []);

  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  const anchor = async () => {
    setBusy("anchor");
    setError(null);
    setNotice(null);
    try {
      await anchorLedger(ledger);
      void refreshWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anchoring failed.");
    } finally {
      setBusy(null);
    }
  };

  const airdrop = async () => {
    setBusy("airdrop");
    setError(null);
    try {
      await requestAirdrop();
      setNotice("Airdrop requested — balance updates in a few seconds.");
      setTimeout(() => void refreshWallet(), 6_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Airdrop failed.");
    } finally {
      setBusy(null);
    }
  };

  const verifyOnChain = async (signature: string) => {
    try {
      const memo = await readAnchoredMemo(signature);
      setReadBack((prev) => ({ ...prev, [signature]: memo ?? "Memo not found yet — try again shortly." }));
    } catch (err) {
      setReadBack((prev) => ({ ...prev, [signature]: err instanceof Error ? err.message : "Read failed." }));
    }
  };

  return (
    <Section
      icon={
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#9945FF] to-[#14F195]">
          <Link2 className="h-4 w-4 text-white" />
        </span>
      }
      title="AI Transparency Ledger"
      sponsor={`Solana${integrations ? ` · ${integrations.solana.cluster}` : ""} · SPL Memo`}
      status={<StatusPill live={integrations ? integrations.solana.live : null} liveLabel="On-chain" offLabel="Local digest" />}
    >
      <p className="text-xs leading-relaxed text-slate-400">
        Every time the algorithm morphs the UI, a human overrides it, or the lock blocks it, the event is
        logged. One click anchors a SHA-256 fingerprint of that log on Solana — tamper-evident proof of what
        the AI did, with zero personal data on-chain.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "AI morphs", value: summary.ai, icon: <Bot className="h-3.5 w-3.5" /> },
          { label: "Human acts", value: summary.human, icon: <Hand className="h-3.5 w-3.5" /> },
          { label: "Blocked", value: summary.blocked, icon: <ShieldBan className="h-3.5 w-3.5" /> },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              {stat.icon}
              {stat.label}
            </div>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-black/20 dark-scroll">
        {ledger.length === 0 ? (
          <p className="px-3 py-4 text-center text-[11px] text-slate-500">
            No events yet — use the Simulate pills or the lock switch.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {[...ledger].reverse().slice(0, 30).map((entry) => (
              <li key={entry.seq} className="flex items-center gap-2 px-3 py-1.5 font-mono text-[10.5px]">
                <span className="text-slate-600">#{entry.seq}</span>
                <span
                  className={cn(
                    "flex items-center gap-1 rounded px-1.5 py-0.5",
                    entry.event === "blocked" ? "bg-amber-400/10 text-amber-300" : "bg-white/5 text-slate-300",
                  )}
                >
                  {EVENT_META[entry.event].icon}
                  {EVENT_META[entry.event].label}
                </span>
                <span className="truncate text-slate-400">
                  {entry.event === "mode" || entry.event === "blocked" ? `${entry.from} → ${entry.to}` : entry.to}
                </span>
                <span className={cn("ml-auto", entry.source === "system" ? "text-violet-300" : "text-emerald-300")}>
                  {entry.source === "system" ? "AI" : "human"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={anchor}
        disabled={busy !== null || ledger.length === 0}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9945FF] to-[#14F195] px-3 py-2 text-xs font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
      >
        {busy === "anchor" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Anchor className="h-3.5 w-3.5" />}
        {busy === "anchor" ? "Writing to Solana…" : `Anchor ${ledger.length} events to Solana`}
      </button>

      {wallet?.configured && (
        <div className="mt-2 flex items-center justify-between gap-2 text-[10.5px] text-slate-500">
          <a
            href={wallet.addressUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-1 truncate hover:text-slate-300"
          >
            <Coins className="h-3 w-3 shrink-0" />
            <span className="truncate font-mono">
              {wallet.address?.slice(0, 4)}…{wallet.address?.slice(-4)}
            </span>
            <span>· {typeof wallet.balance === "number" ? `${wallet.balance.toFixed(3)} SOL` : "balance ?"}</span>
          </a>
          {wallet.cluster !== "mainnet-beta" && (wallet.balance ?? 0) < 0.01 && (
            <button
              onClick={airdrop}
              disabled={busy !== null}
              className="shrink-0 rounded-md border border-white/10 px-2 py-0.5 text-slate-300 hover:bg-white/10"
            >
              {busy === "airdrop" ? "Requesting…" : "Airdrop 1 SOL"}
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-[11px] leading-snug text-rose-300">{error}</p>}
      {notice && <p className="mt-2 text-[11px] leading-snug text-emerald-300">{notice}</p>}

      {anchors.length > 0 && (
        <ul className="mt-3 space-y-2">
          {anchors.map((record) => (
            <li key={record.at} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "chip px-2 py-0.5 text-[10px] font-semibold",
                    record.onChain ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300",
                  )}
                >
                  {record.onChain ? <BadgeCheck className="h-3 w-3" /> : <Anchor className="h-3 w-3" />}
                  {record.onChain ? `Anchored on ${record.cluster}` : "Digest only (not on-chain)"}
                </span>
                <span className="text-[10px] text-slate-500">{record.entries} events</span>
              </div>
              <p className="mt-2 break-all font-mono text-[10px] leading-relaxed text-slate-400">
                sha256 {record.digest}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                {record.verifiedLocally ? "✓ Re-hashed in your browser — matches" : "⚠ Browser hash mismatch"}
              </p>
              {record.onChain && record.signature ? (
                <div className="mt-2 flex items-center gap-3 text-[11px]">
                  <a
                    href={record.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-medium text-violet-300 hover:text-violet-200"
                  >
                    View on Solana Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    onClick={() => void verifyOnChain(record.signature!)}
                    className="text-slate-400 hover:text-white"
                  >
                    Read memo back
                  </button>
                </div>
              ) : (
                record.reason && <p className="mt-1 text-[10px] text-amber-300/80">{record.reason}</p>
              )}
              {record.signature && readBack[record.signature] && (
                <p className="mt-2 break-all rounded-lg bg-black/30 p-2 font-mono text-[10px] text-emerald-200">
                  {readBack[record.signature]}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
