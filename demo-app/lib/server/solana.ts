/**
 * Zero-dependency Solana client for the AI Transparency Ledger.
 *
 * Writes a single SPL Memo instruction to Solana (devnet by default) holding a
 * SHA-256 digest of the session's mode-transition log — when the AI morphed
 * the UI, when a human overrode it, and when the Lock Interface switch blocked
 * the algorithm. Only the hash and counts go on-chain; the log itself never
 * leaves the session, so the ledger is tamper-evident without being a
 * tracking database.
 *
 * Transactions are built, signed (Ed25519 via node:crypto) and sent over
 * plain JSON-RPC, so the app carries no extra npm dependencies or advisories.
 */
import { createPrivateKey, createPublicKey, sign as ed25519Sign, type KeyObject } from "node:crypto";

export const SOLANA_CLUSTER = process.env.SOLANA_CLUSTER || "devnet";
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || clusterRpcUrl(SOLANA_CLUSTER);
const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
const LAMPORTS_PER_SOL = 1_000_000_000;

function clusterRpcUrl(cluster: string): string {
  if (cluster === "mainnet-beta") return "https://api.mainnet-beta.solana.com";
  if (cluster === "testnet") return "https://api.testnet.solana.com";
  return "https://api.devnet.solana.com";
}

export function explorerTxUrl(signature: string): string {
  const suffix = SOLANA_CLUSTER === "mainnet-beta" ? "" : `?cluster=${SOLANA_CLUSTER}`;
  return `https://explorer.solana.com/tx/${signature}${suffix}`;
}

export function explorerAddressUrl(address: string): string {
  const suffix = SOLANA_CLUSTER === "mainnet-beta" ? "" : `?cluster=${SOLANA_CLUSTER}`;
  return `https://explorer.solana.com/address/${address}${suffix}`;
}

// --- base58 ------------------------------------------------------------------

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58Encode(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits: number[] = [];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let out = "1".repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) out += ALPHABET[digits[i]];
  return out;
}

export function base58Decode(value: string): Uint8Array {
  let zeros = 0;
  while (zeros < value.length && value[zeros] === "1") zeros++;
  const bytes: number[] = [];
  for (let i = zeros; i < value.length; i++) {
    const digit = ALPHABET.indexOf(value[i]);
    if (digit < 0) throw new Error("Invalid base58 string.");
    let carry = digit;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  const out = new Uint8Array(zeros + bytes.length);
  for (let i = 0; i < bytes.length; i++) out[zeros + i] = bytes[bytes.length - 1 - i];
  return out;
}

// --- keys ------------------------------------------------------------------

// DER prefix that wraps a raw 32-byte Ed25519 seed as a PKCS#8 private key.
const PKCS8_ED25519_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

export interface Signer {
  publicKey: Uint8Array;
  address: string;
  sign: (message: Uint8Array) => Uint8Array;
}

/** Accepts the JSON byte array `solana-keygen` writes, or a base58 secret key. */
function parseSecretKey(raw: string): Uint8Array {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
      throw new Error("SOLANA_SECRET_KEY must be a JSON array of bytes.");
    }
    return Uint8Array.from(parsed as number[]);
  }
  return base58Decode(trimmed);
}

let cachedSigner: Signer | null | undefined;

export function loadSigner(): Signer | null {
  if (cachedSigner !== undefined) return cachedSigner;
  const raw = process.env.SOLANA_SECRET_KEY;
  if (!raw) {
    cachedSigner = null;
    return null;
  }

  const secret = parseSecretKey(raw);
  if (secret.length !== 64 && secret.length !== 32) {
    throw new Error("SOLANA_SECRET_KEY must be 64 bytes (or a 32-byte seed).");
  }

  const privateKey: KeyObject = createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519_PREFIX, Buffer.from(secret.subarray(0, 32))]),
    format: "der",
    type: "pkcs8",
  });
  const spki = createPublicKey(privateKey).export({ format: "der", type: "spki" });
  const publicKey = new Uint8Array(spki.subarray(spki.length - 32));

  if (secret.length === 64 && Buffer.compare(Buffer.from(secret.subarray(32)), Buffer.from(publicKey)) !== 0) {
    throw new Error("SOLANA_SECRET_KEY is corrupt: its public half does not match its seed.");
  }

  cachedSigner = {
    publicKey,
    address: base58Encode(publicKey),
    sign: (message) => new Uint8Array(ed25519Sign(null, message, privateKey)),
  };
  return cachedSigner;
}

export function isSolanaConfigured(): boolean {
  try {
    return loadSigner() !== null;
  } catch {
    return false;
  }
}

// --- wire format ------------------------------------------------------------

/** Solana's compact-u16 ("shortvec") length prefix. */
function shortVec(length: number): number[] {
  const out: number[] = [];
  let rest = length;
  for (;;) {
    let byte = rest & 0x7f;
    rest >>= 7;
    if (rest === 0) {
      out.push(byte);
      return out;
    }
    byte |= 0x80;
    out.push(byte);
  }
}

/**
 * Legacy transaction message with one Memo instruction. Accounts: the fee
 * payer (writable signer — the memo program also records it as the memo's
 * signer) and the read-only Memo program.
 */
function buildMemoMessage(payer: Uint8Array, recentBlockhash: Uint8Array, memo: Uint8Array): Uint8Array {
  return Uint8Array.from([
    1, 0, 1, // header: 1 required signature, 0 read-only signed, 1 read-only unsigned
    ...shortVec(2),
    ...payer,
    ...base58Decode(MEMO_PROGRAM_ID),
    ...recentBlockhash,
    ...shortVec(1), // one instruction
    1, // program id index → Memo program
    ...shortVec(1),
    0, // account index → payer, as memo signer
    ...shortVec(memo.length),
    ...memo,
  ]);
}

// --- RPC ---------------------------------------------------------------------

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(SOLANA_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(12_000),
  });
  const data = (await response.json().catch(() => ({}))) as {
    result?: T;
    error?: { message?: string };
  };
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Solana RPC ${method} failed (${response.status}).`);
  }
  return data.result as T;
}

export async function getBalanceSol(address: string): Promise<number> {
  const result = await rpc<{ value: number }>("getBalance", [address, { commitment: "confirmed" }]);
  return result.value / LAMPORTS_PER_SOL;
}

export async function requestDevnetAirdrop(address: string): Promise<string> {
  if (SOLANA_CLUSTER === "mainnet-beta") {
    throw new Error("Airdrops are only available on devnet/testnet.");
  }
  return rpc<string>("requestAirdrop", [address, LAMPORTS_PER_SOL]);
}

async function waitForConfirmation(signature: string, timeoutMs = 25_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await rpc<{
      value: Array<{ confirmationStatus?: string; err: unknown } | null>;
    }>("getSignatureStatuses", [[signature]]);
    const status = result.value[0];
    if (status?.err) {
      throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
    }
    if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  throw new Error("Timed out waiting for confirmation — check the explorer link.");
}

/** Builds a fully signed, wire-ready memo transaction. */
export function buildMemoTransaction(signer: Signer, recentBlockhash: string, memoText: string): Uint8Array {
  const memo = new TextEncoder().encode(memoText);
  if (memo.length > 500) {
    throw new Error("Memo too long.");
  }
  const message = buildMemoMessage(signer.publicKey, base58Decode(recentBlockhash), memo);
  return Uint8Array.from([...shortVec(1), ...signer.sign(message), ...message]);
}

export async function getLatestBlockhash(): Promise<string> {
  const { value } = await rpc<{ value: { blockhash: string } }>("getLatestBlockhash", [
    { commitment: "confirmed" },
  ]);
  return value.blockhash;
}

/** Signs, sends and confirms a memo transaction. Returns its signature. */
export async function sendMemo(memoText: string): Promise<string> {
  const signer = loadSigner();
  if (!signer) {
    throw new Error("SOLANA_SECRET_KEY is not configured.");
  }

  const transaction = buildMemoTransaction(signer, await getLatestBlockhash(), memoText);

  const sent = await rpc<string>("sendTransaction", [
    Buffer.from(transaction).toString("base64"),
    { encoding: "base64", preflightCommitment: "confirmed" },
  ]);

  await waitForConfirmation(sent);
  return sent;
}

/** Reads a memo back from chain so the UI can prove what was anchored. */
export async function readMemo(signature: string): Promise<string | null> {
  const tx = await rpc<{ meta?: { logMessages?: string[] } } | null>("getTransaction", [
    signature,
    { encoding: "json", commitment: "confirmed", maxSupportedTransactionVersion: 0 },
  ]);
  const line = tx?.meta?.logMessages?.find((log) => log.includes("Memo (len"));
  const match = line?.match(/Memo \(len \d+\): "(.*)"$/);
  return match ? match[1] : null;
}
