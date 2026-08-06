// ============================================================================
// lib/session.js
// A stateless signed session token: base64(payload) + "." + HMAC(payload).
// No session database needed — the signature alone proves the token was
// issued by the server (whoever holds AUTH_SECRET), and the embedded
// expiry handles logout-by-time. Verifying just means recomputing the HMAC.
// ============================================================================

import { hmacHex, constantTimeEqual } from "./crypto-utils.js";

export const SESSION_COOKIE_NAME = "ovisfix_admin";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

export async function createSessionToken(secret) {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 });
  const payloadB64 = btoa(payload);
  const sig = await hmacHex(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || !secret) return false;
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;

  const payloadB64 = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  const expectedSig = await hmacHex(payloadB64, secret);

  if (!constantTimeEqual(sig, expectedSig)) return false;

  try {
    const payload = JSON.parse(atob(payloadB64));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch (err) {
    return false;
  }
}
