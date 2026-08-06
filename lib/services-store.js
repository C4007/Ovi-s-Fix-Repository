// ============================================================================
// lib/services-store.js — the services array, stored as one JSON blob under
// a single Redis key. Simple and plenty for ~20 items; no schema/migrations
// to worry about.
// ============================================================================

import { kvGet, kvSet } from "./upstash.js";

const SERVICES_KEY = "ovisfix:services";

/** Returns { services: [...], source }. `source` is "kv" on a real hit,
 *  otherwise a reason the caller can use to decide whether to fall back to
 *  a bundled default (see js/data.js on the frontend). */
export async function getStoredServices(env) {
  const result = await kvGet(env, SERVICES_KEY);
  if (!result.ok) return { services: [], source: result.reason };
  if (!result.value) return { services: [], source: "empty" };
  try {
    const parsed = JSON.parse(result.value);
    if (Array.isArray(parsed)) return { services: parsed, source: "kv" };
    return { services: [], source: "malformed" };
  } catch (err) {
    return { services: [], source: "malformed" };
  }
}

export async function saveServices(env, services) {
  return kvSet(env, SERVICES_KEY, JSON.stringify(services));
}
