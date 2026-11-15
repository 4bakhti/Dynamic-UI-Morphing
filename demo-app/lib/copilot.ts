"use client";

import { create } from "zustand";
import { useBehaviourStore } from "../../src/behaviour";
import { useDashboardStore } from "./store";
import { digestLedgerInBrowser, type LedgerEntry } from "./ledger";
import type { DashboardMode } from "./layoutConfig";

/**
 * Client side of the sponsor integrations:
 *  - Gemini   → /api/insight  (nudges, report outlines, "why did my UI change?")
 *  - ElevenLabs → /api/voice  (spoken mode announcements + read-aloud)
 *  - Solana   → /api/ledger   (anchors the AI-transparency log on-chain)
 * Every call degrades to an honest, labelled offline fallback so the live demo
 * never breaks when a key or the network is missing.
 */

export type InsightKind = "nudge" | "outline" | "explain";
export type VoiceSource = "elevenlabs" | "browser";

export interface IntegrationStatus {
  gemini: { live: boolean; model: string };
  elevenlabs: { live: boolean; model: string };
  solana: { live: boolean; cluster: string };
}

export interface InsightResult {
  text: string;
  source: "gemini" | "fallback";
  reason?: string;
}

export interface AnchorRecord {
  onChain: boolean;
  digest: string;
  memo: string;
  entries: number;
  at: number;
  signature?: string;
  explorerUrl?: string;
  cluster: string;
  reason?: string;
  verifiedLocally: boolean;
}

interface CopilotState {
  open: boolean;
  announceModes: boolean;
  speaking: boolean;
  lastVoiceSource: VoiceSource | null;
  voiceError: string | null;
  integrations: IntegrationStatus | null;
  anchors: AnchorRecord[];
  setOpen: (open: boolean) => void;
  toggleAnnounce: () => void;
}

export const useCopilotStore = create<CopilotState>((set) => ({
  open: false,
  announceModes: false,
  speaking: false,
  lastVoiceSource: null,
  voiceError: null,
  integrations: null,
  anchors: [],
  setOpen: (open) => set({ open }),
  toggleAnnounce: () => set((s) => ({ announceModes: !s.announceModes })),
}));

export async function loadIntegrations(): Promise<void> {
  try {
    const res = await fetch("/api/integrations", { cache: "no-store" });
    if (res.ok) useCopilotStore.setState({ integrations: (await res.json()) as IntegrationStatus });
  } catch {
    // Offline — the panel shows "checking…" and every feature still falls back.
  }
}

// --- Gemini ------------------------------------------------------------------

export async function requestInsight(kind: InsightKind): Promise<InsightResult> {
  const { currentMode, ledger } = useDashboardStore.getState();
  const behaviour = useBehaviourStore.getState();
  const activeSignals = Object.values(behaviour.activeZScores).filter((v) => typeof v === "number").length;

  const res = await fetch("/api/insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Numbers only — never the report text the user typed.
    body: JSON.stringify({
      kind,
      mode: currentMode,
      compositeScore: behaviour.compositeScore,
      activeSignals,
      transitions: ledger.filter((e) => e.event === "mode").length,
    }),
  });
  if (!res.ok) throw new Error(`Insight request failed (${res.status}).`);
  return (await res.json()) as InsightResult;
}

// --- ElevenLabs --------------------------------------------------------------

let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  useCopilotStore.setState({ speaking: false });
}

function speakWithBrowser(text: string): VoiceSource | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.98;
  utterance.onend = () => useCopilotStore.setState({ speaking: false });
  utterance.onerror = () => useCopilotStore.setState({ speaking: false });
  window.speechSynthesis.speak(utterance);
  return "browser";
}

export async function speak(text: string): Promise<VoiceSource | null> {
  stopSpeaking();
  useCopilotStore.setState({ speaking: true, voiceError: null });

  try {
    const res = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 1_500) }),
    });

    if (res.ok && res.headers.get("Content-Type")?.includes("audio")) {
      const blob = await res.blob();
      currentAudioUrl = URL.createObjectURL(blob);
      currentAudio = new Audio(currentAudioUrl);
      currentAudio.onended = () => stopSpeaking();
      await currentAudio.play();
      useCopilotStore.setState({ lastVoiceSource: "elevenlabs" });
      return "elevenlabs";
    }

    const detail = (await res.json().catch(() => ({}))) as { error?: string };
    useCopilotStore.setState({ voiceError: detail.error ?? null });
  } catch (error) {
    useCopilotStore.setState({ voiceError: error instanceof Error ? error.message : "Voice failed." });
  }

  const source = speakWithBrowser(text);
  useCopilotStore.setState({ lastVoiceSource: source, speaking: source !== null });
  return source;
}

export const MODE_ANNOUNCEMENTS: Record<DashboardMode, string> = {
  Normal: "Welcome back. Everything is visible again.",
  Focus: "Switching to Focus. I've cleared the clutter so you can concentrate on your report.",
  Exploration: "Looks like you paused. I've dimmed the busy panels and left a hint by your report.",
  Clarity: "Things seemed a little hectic, so I've simplified the screen and made everything easier to read.",
};

// --- Solana ------------------------------------------------------------------

export async function anchorLedger(entries: LedgerEntry[]): Promise<AnchorRecord> {
  const { sessionId } = useDashboardStore.getState();
  const res = await fetch("/api/ledger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "anchor", entries, sessionId }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    onChain?: boolean;
    digest?: string;
    memo?: string;
    signature?: string;
    explorerUrl?: string;
    cluster?: string;
    reason?: string;
    error?: string;
  };
  if (!res.ok || !data.digest) {
    throw new Error(data.error ?? `Anchoring failed (${res.status}).`);
  }

  const localDigest = await digestLedgerInBrowser(entries);
  const record: AnchorRecord = {
    onChain: Boolean(data.onChain),
    digest: data.digest,
    memo: data.memo ?? "",
    entries: entries.length,
    at: Date.now(),
    signature: data.signature,
    explorerUrl: data.explorerUrl,
    cluster: data.cluster ?? "devnet",
    reason: data.reason,
    verifiedLocally: localDigest === data.digest,
  };
  useCopilotStore.setState((s) => ({ anchors: [record, ...s.anchors].slice(0, 10) }));
  return record;
}

export async function readAnchoredMemo(signature: string): Promise<string | null> {
  const res = await fetch(`/api/ledger?signature=${encodeURIComponent(signature)}`, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { memo?: string | null; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Could not read memo.");
  return data.memo ?? null;
}

export async function requestAirdrop(): Promise<string> {
  const res = await fetch("/api/ledger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "airdrop" }),
  });
  const data = (await res.json().catch(() => ({}))) as { explorerUrl?: string; error?: string };
  if (!res.ok || !data.explorerUrl) throw new Error(data.error ?? "Airdrop failed.");
  return data.explorerUrl;
}
