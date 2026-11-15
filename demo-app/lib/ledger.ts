/**
 * AI Transparency Ledger — shared (browser + server) types and canonical
 * serialization. The browser keeps the full log; only its SHA-256 digest and
 * a few counts are anchored on Solana, so anyone holding the log can re-hash
 * it and prove it matches what was written on-chain.
 */
import { DASHBOARD_MODES, type DashboardMode } from "./layoutConfig";

export type LedgerEvent = "mode" | "blocked" | "lock" | "unlock";
export type LedgerSource = "system" | "manual";

export interface LedgerEntry {
  seq: number;
  at: number;
  event: LedgerEvent;
  from: DashboardMode;
  to: DashboardMode;
  source: LedgerSource;
}

export const MAX_LEDGER_ENTRIES = 500;

const EVENTS = new Set<LedgerEvent>(["mode", "blocked", "lock", "unlock"]);
const SOURCES = new Set<LedgerSource>(["system", "manual"]);
const MODES = new Set<string>(DASHBOARD_MODES);

export function isLedgerEntry(value: unknown): value is LedgerEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Number.isInteger(v.seq) &&
    typeof v.at === "number" &&
    Number.isFinite(v.at) &&
    EVENTS.has(v.event as LedgerEvent) &&
    SOURCES.has(v.source as LedgerSource) &&
    MODES.has(v.from as string) &&
    MODES.has(v.to as string)
  );
}

/** One line per entry, fixed field order — the exact bytes that get hashed. */
export function canonicalizeLedger(entries: LedgerEntry[]): string {
  return entries
    .map((e) => [e.seq, Math.round(e.at), e.event, e.from, e.to, e.source].join("|"))
    .join("\n");
}

export function summarizeLedger(entries: LedgerEntry[]) {
  return {
    total: entries.length,
    ai: entries.filter((e) => e.event === "mode" && e.source === "system").length,
    human: entries.filter((e) => e.source === "manual").length,
    blocked: entries.filter((e) => e.event === "blocked").length,
  };
}

export function buildLedgerMemo(digestHex: string, entries: LedgerEntry[], sessionId: string): string {
  const s = summarizeLedger(entries);
  return `dynui-ledger:v1 sha256=${digestHex} n=${s.total} ai=${s.ai} human=${s.human} blocked=${s.blocked} session=${sessionId}`;
}

/** Browser-side digest (Web Crypto) so the UI can verify the on-chain hash. */
export async function digestLedgerInBrowser(entries: LedgerEntry[]): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalizeLedger(entries));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
