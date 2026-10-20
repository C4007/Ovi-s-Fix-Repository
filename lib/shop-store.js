// ============================================================================
// lib/shop-store.js — the shop's admin-editable data. Four independent JSON
// blobs (products, pre-built PCs, offers, store settings) read together with
// ONE Redis MGET so a page view costs a single database command.
// A key that has never been saved comes back as null — the browser then
// shows the bundled starter data from js/shop-seed.js.
// ============================================================================

import { kvMGet, kvSet } from "./upstash.js";

export const SHOP_KEYS = {
  products: "ovisfix:shop:products",
  builds: "ovisfix:shop:builds",
  offers: "ovisfix:shop:offers",
  store: "ovisfix:shop:store",
};

function parse(raw, expect) {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (expect === "array") return Array.isArray(v) ? v : null;
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch (err) {
    return null;
  }
}

export async function getShopData(env) {
  const names = Object.keys(SHOP_KEYS);
  const result = await kvMGet(env, names.map((n) => SHOP_KEYS[n]));
  if (!result.ok) return { products: null, builds: null, offers: null, store: null, source: result.reason };
  const [products, builds, offers, store] = result.values;
  return {
    products: parse(products, "array"),
    builds: parse(builds, "array"),
    offers: parse(offers, "array"),
    store: parse(store, "object"),
    source: "kv",
  };
}

export async function saveShopKey(env, name, data) {
  if (!SHOP_KEYS[name]) return { ok: false, reason: "unknown-key" };
  return kvSet(env, SHOP_KEYS[name], JSON.stringify(data));
}
