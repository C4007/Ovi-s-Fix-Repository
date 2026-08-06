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
