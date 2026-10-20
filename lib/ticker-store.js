// ============================================================================
// lib/ticker-store.js — the hero ticker lines, stored as one JSON blob.
// Same pattern as services-store.js.
// ============================================================================

import { kvGet, kvSet } from "./upstash.js";

const TICKER_KEY = "ovisfix:ticker";

export async function getStoredTicker(env) {
  const result = await kvGet(env, TICKER_KEY);
  if (!result.ok) return { lines: [], source: result.reason };
  if (!result.value) return { lines: [], source: "empty" };
  try {
    const parsed = JSON.parse(result.value);
    if (Array.isArray(parsed)) return { lines: parsed, source: "kv" };
    return { lines: [], source: "malformed" };
  } catch (err) {
    return { lines: [], source: "malformed" };
  }
}

export async function saveTicker(env, lines) {
  return kvSet(env, TICKER_KEY, JSON.stringify(lines));
}
