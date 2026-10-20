// ============================================================================
// lib/image-store.js — product / build photos uploaded from the admin panel.
// Each image lives under its own Redis key as { m: mimeType, d: base64 } and is
// served by /api/image?id=... with a long browser cache. The admin page shrinks
// every photo to ~900px before upload, so each one stays well under 300 KB.
// ============================================================================

import { kvGet, kvSet, kvDel } from "./upstash.js";

const PREFIX = "ovisfix:img:";
const ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
export const IMAGE_MAX_BASE64 = 600_000; // ~450 KB of image bytes

export function isValidImageId(id) {
  return typeof id === "string" && ID_RE.test(id);
}

export async function saveImage(env, id, dataUrl) {
  if (!isValidImageId(id)) return { ok: false, error: "Invalid image id." };
  const m = typeof dataUrl === "string" ? DATA_URL_RE.exec(dataUrl) : null;
  if (!m) return { ok: false, error: "Image must be a JPEG, PNG or WebP data URL." };
  if (m[2].length > IMAGE_MAX_BASE64) return { ok: false, error: "Image is too large (max ~450 KB after resizing)." };
  const res = await kvSet(env, PREFIX + id, JSON.stringify({ m: m[1], d: m[2] }));
  return res.ok ? { ok: true } : { ok: false, error: "Could not save — check the Upstash environment variables." };
}

export async function getImage(env, id) {
  if (!isValidImageId(id)) return null;
  const res = await kvGet(env, PREFIX + id);
  if (!res.ok || !res.value) return null;
  try {
    const { m, d } = JSON.parse(res.value);
    if (typeof m !== "string" || typeof d !== "string") return null;
    const bin = atob(d);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { mime: m, bytes };
  } catch (err) {
    return null;
  }
}

export async function deleteImage(env, id) {
  if (!isValidImageId(id)) return { ok: false };
  return kvDel(env, PREFIX + id);
}
