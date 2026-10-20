// ============================================================================
// lib/validate-shop.js — sanity checks for everything the admin panel saves
// to the shop (products, pre-built PCs, offers, store settings). Strict on
// purpose: a bad value must never reach the live site and break a page.
// ============================================================================

import { SUBS } from "../js/catalog-schema.js";

const ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const STOCK = ["in", "pre", "soon", "out"];
const isStr = (v, max) => typeof v === "string" && v.length <= max;
const isNum = (v, min, max) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const isLoc = (v, max) => v && typeof v === "object" && isStr(v.en, max) && isStr(v.bn, max);
const isIsoDate = (v) => v === null || v === undefined || v === "" || (isStr(v, 40) && !Number.isNaN(Date.parse(v)));

export function validateProducts(input) {
  if (!Array.isArray(input)) return "Expected an array of products.";
  if (input.length > 3000) return "Too many products (max 3000).";
  const seen = new Set();
  for (let i = 0; i < input.length; i++) {
    const p = input[i];
    const label = `Product ${i + 1}${p && p.name ? ` (${String(p.name).slice(0, 40)})` : ""}`;
    if (!p || typeof p !== "object") return `${label}: not a valid object.`;
    if (!isStr(p.id, 80) || !ID_RE.test(p.id)) return `${label}: id must be lowercase letters, numbers and dashes.`;
    if (seen.has(p.id)) return `${label}: duplicate id "${p.id}".`;
    seen.add(p.id);
    if (!isStr(p.name, 220) || !p.name.trim()) return `${label}: name is required.`;
    if (!SUBS[p.sub]) return `${label}: unknown category "${p.sub}".`;
    if (!isStr(p.brand ?? "", 60)) return `${label}: brand is too long.`;
    if (!isNum(p.price, 0, 100_000_000)) return `${label}: price must be a number.`;
    if (p.salePrice !== null && p.salePrice !== undefined && !isNum(p.salePrice, 0, 100_000_000)) return `${label}: sale price must be a number.`;
    if (!STOCK.includes(p.stock)) return `${label}: stock must be one of ${STOCK.join(", ")}.`;
    if (!isStr(p.image ?? "", 400)) return `${label}: image path is too long.`;
    if (!isStr(p.desc ?? "", 3000)) return `${label}: description is too long.`;
    for (const k of ["tdp", "perf", "igpu"]) {
      if (p[k] !== null && p[k] !== undefined && !isNum(p[k], 0, 5000)) return `${label}: ${k} must be a number.`;
    }
    if (p.specs !== undefined) {
      if (!p.specs || typeof p.specs !== "object" || Array.isArray(p.specs)) return `${label}: specs must be an object.`;
      const keys = Object.keys(p.specs);
      if (keys.length > 60) return `${label}: too many spec fields.`;
      for (const k of keys) {
        const v = p.specs[k];
        const okScalar = (x) => (typeof x === "string" && x.length <= 200) || (typeof x === "number" && Number.isFinite(x));
        if (Array.isArray(v)) {
          if (v.length > 40 || !v.every((x) => typeof x === "string" && x.length <= 100)) return `${label}: spec "${k}" list is invalid.`;
        } else if (!okScalar(v)) return `${label}: spec "${k}" is invalid.`;
      }
    }
  }
  return null;
}

export function validateBuilds(input) {
  if (!Array.isArray(input)) return "Expected an array of pre-built PCs.";
  if (input.length > 60) return "Too many pre-built PCs (max 60).";
  const seen = new Set();
  for (let i = 0; i < input.length; i++) {
    const b = input[i];
    const label = `Pre-built PC ${i + 1}`;
    if (!b || typeof b !== "object") return `${label}: not a valid object.`;
    if (!isStr(b.id, 80) || !ID_RE.test(b.id)) return `${label}: id must be lowercase letters, numbers and dashes.`;
    if (seen.has(b.id)) return `${label}: duplicate id.`;
    seen.add(b.id);
    if (!isLoc(b.name, 120) || !b.name.en.trim()) return `${label}: English and Bangla names are required.`;
    if (b.tagline !== undefined && !isLoc(b.tagline, 300)) return `${label}: tagline is invalid.`;
    if (!Array.isArray(b.parts) || b.parts.length > 40) return `${label}: parts list is invalid.`;
    for (const part of b.parts) {
      if (!part || !isStr(part.id, 80) || !Number.isInteger(part.qty) || part.qty < 1 || part.qty > 20) return `${label}: a part has an invalid id or quantity.`;
    }
    if (!isStr(b.image ?? "", 400)) return `${label}: image path is too long.`;
    if (b.priceOverride !== null && b.priceOverride !== undefined && !isNum(b.priceOverride, 0, 100_000_000)) return `${label}: price must be a number.`;
    if (!isStr(b.badge ?? "", 40) || !isStr(b.useCase ?? "", 60)) return `${label}: badge or use case is too long.`;
    if (b.highlights !== undefined && (!Array.isArray(b.highlights) || b.highlights.length > 10 || !b.highlights.every((h) => isLoc(h, 200)))) return `${label}: highlights are invalid.`;
  }
  return null;
}

export function validateOffers(input) {
  if (!Array.isArray(input)) return "Expected an array of offers.";
  if (input.length > 60) return "Too many offers (max 60).";
  const seen = new Set();
  for (let i = 0; i < input.length; i++) {
    const o = input[i];
    const label = `Offer ${i + 1}`;
    if (!o || typeof o !== "object") return `${label}: not a valid object.`;
    if (!isStr(o.id, 80) || !ID_RE.test(o.id)) return `${label}: id must be lowercase letters, numbers and dashes.`;
    if (seen.has(o.id)) return `${label}: duplicate id.`;
    seen.add(o.id);
    if (!isLoc(o.title, 140) || !o.title.en.trim()) return `${label}: English and Bangla titles are required.`;
    if (o.subtitle !== undefined && !isLoc(o.subtitle, 400)) return `${label}: subtitle is invalid.`;
    if (!["discount", "perk"].includes(o.kind)) return `${label}: kind must be discount or perk.`;
    if (o.kind === "discount") {
      if (!["percent", "amount"].includes(o.type)) return `${label}: type must be percent or amount.`;
      if (!isNum(o.value, 0, o.type === "percent" ? 90 : 10_000_000)) return `${label}: discount value is out of range.`;
    }
    const t = o.target;
    if (!t || typeof t !== "object") return `${label}: target is missing.`;
    for (const k of ["categories", "subs", "brands", "productIds"]) {
      if (!Array.isArray(t[k]) || t[k].length > 500 || !t[k].every((x) => isStr(x, 80))) return `${label}: target ${k} is invalid.`;
    }
    if (!isIsoDate(o.startsAt) || !isIsoDate(o.endsAt)) return `${label}: dates must look like 2026-12-31.`;
    if (!isStr(o.link ?? "", 200) || !isStr(o.badge ?? "", 40)) return `${label}: link or badge is too long.`;
  }
  return null;
}

const STORE_LOC_FIELDS = ["address", "hours", "freeServiceNote", "preorderNote", "tcNote", "priceNote", "heroTitle", "heroSub"];
const STORE_STR_FIELDS = ["phone", "altPhone", "email", "facebook", "instagram", "youtube", "linkedin", "whatsappMessage"];

export function validateStore(s) {
  if (!s || typeof s !== "object" || Array.isArray(s)) return "Store settings must be an object.";
  if (!isStr(s.whatsapp, 20) || !/^\d{8,15}$/.test(s.whatsapp)) return "WhatsApp number must be digits only with country code (e.g. 8801948977199).";
  for (const k of STORE_LOC_FIELDS) {
    if (s[k] !== undefined && !isLoc(s[k], 600)) return `"${k}" needs both English and Bangla text (max 600 characters).`;
  }
  for (const k of STORE_STR_FIELDS) {
    if (s[k] !== undefined && !isStr(s[k], 300)) return `"${k}" is too long.`;
  }
  return null;
}

export const SHOP_VALIDATORS = {
  products: validateProducts,
  builds: validateBuilds,
  offers: validateOffers,
  store: validateStore,
};
