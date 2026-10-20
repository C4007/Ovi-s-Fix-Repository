// ============================================================================
// lib/upstash.js
// Thin wrapper around Upstash Redis's REST API (https://upstash.com) using
// plain fetch — no SDK, so it works identically on Vercel and Cloudflare.
// `env` is whichever env-var source the calling platform hands in
// (process.env on Vercel, context.env on Cloudflare Pages Functions).
// ============================================================================

function getConfig(env) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

export async function kvGet(env, key) {
  const cfg = getConfig(env);
  if (!cfg) return { ok: false, reason: "not-configured" };
  try {
    const res = await fetch(`${cfg.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    if (!res.ok) return { ok: false, reason: "error" };
    const data = await res.json();
    return { ok: true, value: data.result ?? null };
  } catch (err) {
    return { ok: false, reason: "error" };
  }
}

export async function kvSet(env, key, value) {
  const cfg = getConfig(env);
  if (!cfg) return { ok: false, reason: "not-configured" };
  try {
    const res = await fetch(`${cfg.url}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "text/plain",
      },
      body: value,
    });
    if (!res.ok) return { ok: false, reason: "error" };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: "error" };
  }
}

/** Read several keys in ONE Redis command (MGET). Returns { ok, values: [string|null, ...] }
 *  in the same order as `keys`. Falls back to single GETs if MGET isn't accepted. */
export async function kvMGet(env, keys) {
  const cfg = getConfig(env);
  if (!cfg) return { ok: false, reason: "not-configured" };
  try {
    const res = await fetch(`${cfg.url}/mget/${keys.map(encodeURIComponent).join("/")}`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.result)) return { ok: true, values: data.result.map((v) => v ?? null) };
    }
  } catch (err) {
    /* fall through to the per-key fallback below */
  }
  const values = [];
  for (const key of keys) {
    const r = await kvGet(env, key);
    if (!r.ok) return { ok: false, reason: r.reason };
    values.push(r.value);
  }
  return { ok: true, values };
}

export async function kvDel(env, key) {
  const cfg = getConfig(env);
  if (!cfg) return { ok: false, reason: "not-configured" };
  try {
    const res = await fetch(`${cfg.url}/del/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    return res.ok ? { ok: true } : { ok: false, reason: "error" };
  } catch (err) {
    return { ok: false, reason: "error" };
  }
}

/** INCR a counter and make sure it expires — used for login rate limiting.
 *  Returns the new count, or null when Redis isn't available (caller then skips limiting). */
export async function kvIncrWithTtl(env, key, ttlSeconds) {
  const cfg = getConfig(env);
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", key], ["EXPIRE", key, ttlSeconds, "NX"]]),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const n = Number(data?.[0]?.result);
    return Number.isFinite(n) ? n : null;
  } catch (err) {
    return null;
  }
}
