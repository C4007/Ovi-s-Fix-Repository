// ============================================================================
// lib/hero-store.js — the custom hero banner image (admin-uploaded), stored
// as one JSON blob: { dataUrl, width, height, updatedAt }. Same pattern as
// services-store.js / ticker-store.js.
//
// This is intentionally a single-image slot, not a media library — base64
// in Redis works fine for exactly one background image within a sane size
// budget (see lib/validate-hero.js), but isn't meant to scale beyond that.
// A real media library would need object storage (Vercel Blob / Cloudflare
// R2) instead — a bigger, separate feature.
// ============================================================================

import { kvGet, kvSet } from "./upstash.js";

const HERO_KEY = "ovisfix:hero-image";

export async function getStoredHero(env) {
  const result = await kvGet(env, HERO_KEY);
  if (!result.ok) return { image: null, source: result.reason };
  if (!result.value) return { image: null, source: "empty" };
  try {
    const parsed = JSON.parse(result.value);
    if (parsed && typeof parsed.dataUrl === "string") return { image: parsed, source: "kv" };
    return { image: null, source: "malformed" };
  } catch (err) {
    return { image: null, source: "malformed" };
  }
}

export async function saveHero(env, image) {
  return kvSet(env, HERO_KEY, JSON.stringify(image));
}
