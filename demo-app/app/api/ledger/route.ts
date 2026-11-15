import { createHash } from "node:crypto";
import {
  MAX_LEDGER_ENTRIES,
  buildLedgerMemo,
  canonicalizeLedger,
  isLedgerEntry,
  summarizeLedger,
  type LedgerEntry,
} from "@/lib/ledger";
import { isRateLimited, jsonResponse, readJson } from "@/lib/server/guards";
import {
  SOLANA_CLUSTER,
  explorerAddressUrl,
  explorerTxUrl,
  getBalanceSol,
  loadSigner,
  readMemo,
  requestDevnetAirdrop,
  sendMemo,
} from "@/lib/server/solana";

export const runtime = "nodejs";
export const maxDuration = 45;

function signerOrError() {
  try {
    return { signer: loadSigner(), error: null as string | null };
  } catch (error) {
    return { signer: null, error: error instanceof Error ? error.message : "Invalid Solana key." };
  }
}

/** Wallet status, or `?signature=` to read an anchored memo back from chain. */
export async function GET(req: Request) {
  const signature = new URL(req.url).searchParams.get("signature");
  if (signature) {
    if (!/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(signature)) {
      return jsonResponse(400, { error: "Invalid signature." });
    }
    try {
      return jsonResponse(200, { memo: await readMemo(signature) });
    } catch (error) {
      return jsonResponse(502, { error: error instanceof Error ? error.message : "RPC error." });
    }
  }

  const { signer, error } = signerOrError();
  if (!signer) {
    return jsonResponse(200, { configured: false, cluster: SOLANA_CLUSTER, error });
  }

  let balance: number | null = null;
  try {
    balance = await getBalanceSol(signer.address);
  } catch {
    // RPC hiccup — still report the wallet so the UI can link to it.
  }
  return jsonResponse(200, {
    configured: true,
    cluster: SOLANA_CLUSTER,
    address: signer.address,
    addressUrl: explorerAddressUrl(signer.address),
    balance,
  });
}

/**
 * POST { action: "anchor", entries, sessionId } → writes the log digest as a
 * Solana memo. POST { action: "airdrop" } → tops up the devnet wallet.
 */
export async function POST(req: Request) {
  if (isRateLimited(req, "ledger")) {
    return jsonResponse(429, { error: "Too many ledger requests — wait a minute." });
  }

  const body = await readJson(req);
  if (!body) {
    return jsonResponse(400, { error: "Request body must be valid JSON." });
  }

  const { signer, error: keyError } = signerOrError();

  if (body.action === "airdrop") {
    if (!signer) return jsonResponse(503, { error: keyError ?? "SOLANA_SECRET_KEY is not configured." });
    try {
      const signature = await requestDevnetAirdrop(signer.address);
      return jsonResponse(200, { signature, explorerUrl: explorerTxUrl(signature) });
    } catch (error) {
      return jsonResponse(502, {
        error: `${error instanceof Error ? error.message : "Airdrop failed."} Try https://faucet.solana.com for ${signer.address}.`,
      });
    }
  }

  const rawEntries = Array.isArray(body.entries) ? body.entries : null;
  if (!rawEntries || rawEntries.length === 0) {
    return jsonResponse(400, { error: "Nothing to anchor yet — morph the interface first." });
  }
  if (rawEntries.length > MAX_LEDGER_ENTRIES) {
    return jsonResponse(413, { error: `At most ${MAX_LEDGER_ENTRIES} ledger entries per anchor.` });
  }
  if (!rawEntries.every(isLedgerEntry)) {
    return jsonResponse(400, { error: "Ledger entries are malformed." });
  }
  const entries = rawEntries as LedgerEntry[];
  const sessionId =
    typeof body.sessionId === "string" && /^[a-f0-9]{8}$/.test(body.sessionId) ? body.sessionId : "anon0000";

  const digest = createHash("sha256").update(canonicalizeLedger(entries)).digest("hex");
  const memo = buildLedgerMemo(digest, entries, sessionId);
  const summary = summarizeLedger(entries);

  if (!signer) {
    // Honest fallback: the digest is real, but nothing was written on-chain.
    return jsonResponse(200, {
      onChain: false,
      digest,
      memo,
      summary,
      cluster: SOLANA_CLUSTER,
      reason: keyError ?? "SOLANA_SECRET_KEY is not configured — digest computed locally only.",
    });
  }

  try {
    const signature = await sendMemo(memo);
    return jsonResponse(200, {
      onChain: true,
      digest,
      memo,
      summary,
      cluster: SOLANA_CLUSTER,
      signature,
      explorerUrl: explorerTxUrl(signature),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Solana transaction failed.";
    const hint = /insufficient|debit an account|no record of a prior credit|InvalidAccountForFee|AccountNotFound/i.test(message)
      ? ` The wallet ${signer.address} needs devnet SOL — use the airdrop button or https://faucet.solana.com.`
      : "";
    return jsonResponse(502, { error: message + hint, digest, memo, summary });
  }
}
