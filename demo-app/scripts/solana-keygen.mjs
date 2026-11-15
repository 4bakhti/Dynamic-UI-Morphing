#!/usr/bin/env node
/**
 * Creates a throwaway Solana devnet wallet for the AI Transparency Ledger and
 * prints the env line to paste into demo-app/.env.local (or Vercel env vars).
 *
 *   node scripts/solana-keygen.mjs            # print a new key + address
 *   node scripts/solana-keygen.mjs --airdrop  # …and request 1 devnet SOL
 *
 * Devnet SOL has no monetary value. Never reuse this key on mainnet.
 */
import { generateKeyPairSync } from "node:crypto";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58(bytes) {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits = [];
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
  return "1".repeat(zeros) + digits.reverse().map((d) => ALPHABET[d]).join("");
}

const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const seed = privateKey.export({ format: "der", type: "pkcs8" }).subarray(-32);
const pub = publicKey.export({ format: "der", type: "spki" }).subarray(-32);
const secret = [...seed, ...pub];
const address = base58(pub);

console.log(`\nAddress (devnet): ${address}`);
console.log(`Explorer:         https://explorer.solana.com/address/${address}?cluster=devnet\n`);
console.log("Add this line to demo-app/.env.local (keep it secret, it is gitignored):\n");
console.log(`SOLANA_SECRET_KEY=${JSON.stringify(secret)}\n`);

if (process.argv.includes("--airdrop")) {
  const res = await fetch(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "requestAirdrop", params: [address, 1_000_000_000] }),
  });
  const data = await res.json().catch(() => ({}));
  if (data.result) {
    console.log(`Airdrop requested: https://explorer.solana.com/tx/${data.result}?cluster=devnet`);
  } else {
    console.log(`Airdrop failed (${data.error?.message ?? res.status}). Fund it at https://faucet.solana.com instead.`);
  }
} else {
  console.log("Fund it with: https://faucet.solana.com (devnet), or rerun with --airdrop.");
}
