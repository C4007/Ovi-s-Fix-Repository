// ============================================================================
// lib/crypto-utils.js
// Uses the Web Crypto API (globalThis.crypto.subtle) rather than Node's
// `crypto` module, on purpose: Web Crypto is available natively in BOTH the
// Vercel Node.js runtime (Node 20+) and the Cloudflare Workers runtime, so
// this same file works unmodified from either platform's handler.
// ============================================================================

/** HMAC-SHA256 of `message` using `secret`, returned as a hex string. */
export async function hmacHex(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time-ish string comparison — avoids trivial early-exit timing
 *  leaks on the comparison loop itself. Appropriate for a single-admin
 *  password check, not a substitute for a full auth system. */
export function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
