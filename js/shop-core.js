/* ==========================================================================
   Ovi's Fix — shop-core.js
   Everything the shop pages share: language helpers, loading the shop data
   (from /api/shop, falling back to the starter data), prices and offers,
   the cart, and small UI helpers (toast, placeholders, PC illustration).
   ========================================================================== */

import { seedProducts, seedBuilds, seedOffers, seedStore } from "./shop-seed.js";
import { SUBS, CATEGORIES, STOCK, catOfSub } from "./catalog-schema.js";
import { translations } from "./translations.js";
import { getCurrentLanguage } from "./language.js";
import { icon } from "./icons.js";

/* ---------------------------------------------------------------- language */
export const lang = () => getCurrentLanguage();

function resolvePath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

/** Translate a dot-path key (e.g. "shop.addToCart"). {name} placeholders are filled from `vars`. */
export function T(path, vars) {
  let v = resolvePath(translations[lang()] || translations.en, path);
  if (typeof v !== "string") v = resolvePath(translations.en, path);
  if (typeof v !== "string") return path.split(".").pop();
  return vars ? v.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? "")) : v;
}

/** Pick the current language from { en, bn } (or pass a plain string through). */
export const loc = (v) => (v && typeof v === "object" ? v[lang()] || v.en || "" : v ?? "");

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const money = (n) => "৳" + Math.round(Number(n) || 0).toLocaleString("en-US");
export const priceText = (n) => (n > 0 ? money(n) : T("shop.callForPrice"));
export const slugify = (s) =>
  String(s || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "item";

/** "AMD Ryzen 5 5600 Processor" → "Ryzen 5 5600" — a short label for tight places. */
export const shortName = (name) =>
  String(name || "").replace(/\b(Processor|Desktop|Graphics Card|Gaming|Power Supply|Casing|Motherboard|CPU Air Cooler|Hard Disk|HDD|Internal|SSD)\b/gi, "").replace(/^(AMD|Intel|ASUS|MSI|Gigabyte|Kingston|Lexar|Corsair|Cooler Master|DeepCool|Seagate)\s+/i, "").replace(/\s{2,}/g, " ").trim();

export const stockLabel = (key) => loc(STOCK[key] || STOCK.pre);
export const subLabel = (sub) => loc(SUBS[sub]?.label) || sub;
export const catLabel = (cat) => loc(CATEGORIES[cat]?.label) || cat;
export const catUrl = (cat) => `/shop/${cat}`;
export const subUrl = (sub) => `/shop/${catOfSub(sub)}/${sub}`;
export const productUrl = (p) => `/product?id=${encodeURIComponent(p.id)}`;

/** Set the tab title + meta description for the current language. Pages that call this
 *  mark <html data-custom-title> so the generic title from translations.js is not applied. */
export function setPageMeta(title, description) {
  document.title = title ? `${title} — Ovi's Fix` : "Ovi's Fix";
  const meta = document.querySelector('meta[name="description"]');
  if (meta && description) meta.setAttribute("content", description);
}

/* -------------------------------------------------------------------- data */
const SESSION_KEY = "ovisfix-shop-v1";
const SESSION_TTL = 45_000;
let dataPromise = null;
let data = null;

function normalizeProduct(p) {
  return {
    ...p,
    brand: p.brand || "",
    specs: p.specs && typeof p.specs === "object" ? p.specs : {},
    stock: STOCK[p.stock] ? p.stock : "pre",
    price: Number(p.price) || 0,
    salePrice: p.salePrice === null || p.salePrice === undefined || p.salePrice === "" ? null : Number(p.salePrice),
    image: p.image || "",
    createdAt: Number(p.createdAt) || 0,
  };
}

function buildData(remote) {
  const hasProducts = Array.isArray(remote?.products);
  const products = (hasProducts ? remote.products : seedProducts).map(normalizeProduct);
  const builds = Array.isArray(remote?.builds) ? remote.builds : seedBuilds;
  const offers = Array.isArray(remote?.offers) ? remote.offers : seedOffers;
  const store = { ...seedStore, ...(remote?.store && typeof remote.store === "object" ? remote.store : {}) };
  data = {
    products, builds, offers, store,
    byId: new Map(products.map((p) => [p.id, p])),
    // "saved" tells the admin panel whether it is editing real saved data or the starter set.
    saved: { products: hasProducts, builds: Array.isArray(remote?.builds), offers: Array.isArray(remote?.offers), store: !!remote?.store },
    source: remote ? remote.source || "kv" : "seed",
  };
  return data;
}

export function loadShop() {
  if (!dataPromise) {
    dataPromise = (async () => {
      let remote = null;
      try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (raw) {
          const j = JSON.parse(raw);
          if (Date.now() - j.t < SESSION_TTL) remote = j.d;
        }
      } catch (err) { /* ignore */ }
      if (!remote) {
        try {
          const res = await fetch("/api/shop", { cache: "no-store" });
          if (res.ok) {
            remote = await res.json();
            try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ t: Date.now(), d: remote })); } catch (err) { /* ignore */ }
          }
        } catch (err) { /* offline or running without the API: use starter data */ }
      }
      return buildData(remote);
    })();
  }
  return dataPromise;
}

export function resetShopCache() {
  dataPromise = null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch (err) { /* ignore */ }
}

export const shop = () => data;
export const getProduct = (id) => data?.byId.get(id) || null;

/* ------------------------------------------------------------ offers / price */
const lc = (s) => String(s || "").trim().toLowerCase();

function parseDay(str, endOfDay) {
  if (!str) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0).getTime();
  const t = Date.parse(str);
  return Number.isNaN(t) ? null : t;
}

export function offerActive(o, now = Date.now()) {
  if (!o || o.active === false) return false;
  const s = parseDay(o.startsAt, false);
  const e = parseDay(o.endsAt, true);
  if (s !== null && now < s) return false;
  if (e !== null && now > e) return false;
  return true;
}

export function offerAppliesTo(o, p) {
  if (!o || o.kind !== "discount") return false;
  const t = o.target || {};
  if (t.all === true) return true;
  return (
    (t.productIds || []).includes(p.id) ||
    (t.subs || []).includes(p.sub) ||
    (t.categories || []).includes(catOfSub(p.sub)) ||
    (t.brands || []).some((b) => lc(b) === lc(p.brand))
  );
}

export function discountedPrice(price, o) {
  const v = o.type === "percent" ? price * (1 - o.value / 100) : price - o.value;
  return Math.max(0, Math.round(v));
}

/** The price a customer actually pays: the lowest of the regular price, the product's own
 *  sale price, and any live discount offer. */
export function priceInfo(p, offers = data?.offers || []) {
  let best = p.price;
  let offer = null;
  let source = null;
  if (p.salePrice !== null && p.salePrice >= 0 && p.salePrice < best) { best = p.salePrice; source = "sale"; }
  const now = Date.now();
  for (const o of offers) {
    if (!offerActive(o, now) || !offerAppliesTo(o, p)) continue;
    const d = discountedPrice(p.price, o);
    if (d < best) { best = d; offer = o; source = "offer"; }
  }
  return {
    price: best, regular: p.price, onSale: best < p.price,
    pct: p.price > 0 ? Math.round((1 - best / p.price) * 100) : 0, offer, source,
  };
}

export const activeOffers = (kind) => (data?.offers || []).filter((o) => offerActive(o) && (!kind || o.kind === kind));

/* ------------------------------------------------------------------- builds */
export function buildParts(b) {
  return (b.parts || []).map((x) => ({ p: getProduct(x.id), qty: x.qty })).filter((x) => x.p);
}
export function buildPrice(b) {
  const parts = buildParts(b);
  const sum = parts.reduce((s, x) => s + priceInfo(x.p).price * x.qty, 0);
  const regular = parts.reduce((s, x) => s + x.p.price * x.qty, 0);
  const override = b.priceOverride !== null && b.priceOverride !== undefined && b.priceOverride !== "" ? Number(b.priceOverride) : null;
  return { price: override ?? sum, partsTotal: sum, regular, hasOverride: override !== null, missing: (b.parts || []).length - parts.length };
}

/* --------------------------------------------------------------------- cart */
const CART_KEY = "ovisfix-cart";
const CART_META_KEY = "ovisfix-cart-meta";

function readJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v ?? fallback; } catch (err) { return fallback; }
}
function writeJSON(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch (err) { /* private mode: cart just won't persist */ }
}

export const cart = {
  read() {
    const a = readJSON(CART_KEY, []);
    return Array.isArray(a)
      ? a.filter((x) => x && typeof x.id === "string" && x.qty > 0).map((x) => ({ id: x.id, qty: Math.min(99, Math.floor(x.qty)) }))
      : [];
  },
  write(items) {
    writeJSON(CART_KEY, items);
    document.dispatchEvent(new CustomEvent("ovisfix:cartchange"));
  },
  add(id, qty = 1) {
    const items = this.read();
    const f = items.find((i) => i.id === id);
    if (f) f.qty = Math.min(99, f.qty + qty);
    else items.push({ id, qty: Math.min(99, qty) });
    this.write(items);
  },
  addMany(list) {
    const items = this.read();
    for (const { id, qty } of list) {
      const f = items.find((i) => i.id === id);
      if (f) f.qty = Math.min(99, f.qty + qty);
      else items.push({ id, qty: Math.min(99, qty) });
    }
    this.write(items);
  },
  setQty(id, qty) {
    const items = this.read();
    const f = items.find((i) => i.id === id);
    if (!f) return;
    if (qty <= 0) items.splice(items.indexOf(f), 1);
    else f.qty = Math.min(99, Math.floor(qty));
    this.write(items);
  },
  remove(id) { this.write(this.read().filter((i) => i.id !== id)); },
  clear() { this.write([]); writeJSON(CART_META_KEY, {}); },
  count() { return this.read().reduce((s, i) => s + i.qty, 0); },
  /** meta.fromBuilder = the cart holds a PC built here → the order message mentions the free service charge. */
  meta() { return readJSON(CART_META_KEY, {}) || {}; },
  setMeta(m) { writeJSON(CART_META_KEY, { ...this.meta(), ...m }); },
};

window.addEventListener("storage", (e) => {
  if (e.key === CART_KEY) document.dispatchEvent(new CustomEvent("ovisfix:cartchange"));
});

/* --------------------------------------------------------- WhatsApp / orders */
export function waLink(text) {
  const num = (data?.store?.whatsapp || seedStore.whatsapp).replace(/\D/g, "");
  return `https://wa.me/${num}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function orderLines(items) {
  const lines = [];
  let total = 0;
  for (const it of items) {
    const p = getProduct(it.id);
    if (!p) continue;
    const info = priceInfo(p);
    const line = info.price * it.qty;
    total += line;
    lines.push(`${it.qty} x ${p.name} - ${money(info.price)}${it.qty > 1 ? ` (${money(line)})` : ""}`);
  }
  return { lines, total };
}

export function buildOrderText(items, customer = {}) {
  const { lines, total } = orderLines(items);
  const out = ["Hello Ovi's Fix, I'd like to order from the website:", "", ...lines, "", `Total: ${money(total)}`];
  if (cart.meta().fromBuilder) out.push("PC built with the website PC Builder (free service charge).");
  if (customer.name) out.push("", `Name: ${customer.name}`);
  if (customer.phone) out.push(`Phone: ${customer.phone}`);
  if (customer.address) out.push(`Address: ${customer.address}`);
  if (customer.note) out.push(`Note: ${customer.note}`);
  return out.join("\n");
}

/* ----------------------------------------------------- images / placeholders */
export function imgSrc(path) {
  if (!path) return "";
  if (/^(https?:|data:|\/)/.test(path)) return path;
  return "/" + path.replace(/^\.?\//, "");
}

export function placeholderHTML(sub, label) {
  const ic = SUBS[sub]?.icon || "box";
  return `<div class="ph" role="img" aria-label="${esc(label || "")}">${icon(ic)}</div>`;
}

export function mediaHTML(p) {
  const src = imgSrc(p.image);
  if (!src) return placeholderHTML(p.sub, p.name);
  return `<img src="${esc(src)}" alt="${esc(p.name)}" loading="lazy" decoding="async" data-ph-sub="${esc(p.sub)}">`;
}

/** A broken product photo falls back to the category illustration instead of a broken-image icon. */
export function installImageFallback() {
  document.addEventListener("error", (e) => {
    const el = e.target;
    if (el && el.tagName === "IMG" && el.dataset.phSub) {
      const holder = document.createElement("div");
      holder.innerHTML = placeholderHTML(el.dataset.phSub, el.alt);
      el.replaceWith(holder.firstElementChild);
    }
  }, true);
}

/** Flat illustration of a PC tower — used for pre-built PCs that have no photo yet. */
let artSeq = 0;
export function towerArt(accent = "#2f6fed") {
  const id = `tw${++artSeq}`;
  const fan = (cx, cy, r = 20) => `
    <g transform="translate(${cx} ${cy})">
      <circle r="${r}" fill="#080b13" stroke="${accent}" stroke-opacity=".8" stroke-width="2"/>
      <circle r="${r - 6}" fill="none" stroke="${accent}" stroke-opacity=".3"/>
      ${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M0 0C3-6 10-9 ${r - 6}-3 8-1 3 0 0 0z" fill="${accent}" fill-opacity=".55" transform="rotate(${a})"/>`).join("")}
      <circle r="3" fill="${accent}"/>
    </g>`;
  return `<svg class="tower-art" viewBox="0 0 240 300" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2335"/><stop offset="1" stop-color="#0a0e18"/></linearGradient>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${accent}" stop-opacity=".22"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></linearGradient>
      <filter id="${id}f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <ellipse cx="120" cy="288" rx="84" ry="7" fill="#0b1b33" opacity=".16"/>
    <rect x="44" y="12" width="152" height="268" rx="14" fill="url(#${id}b)"/>
    <rect x="44.5" y="12.5" width="151" height="267" rx="13.5" fill="none" stroke="#fff" stroke-opacity=".08"/>
    <rect x="56" y="24" width="128" height="236" rx="8" fill="#0d1220"/>
    <rect x="56" y="24" width="128" height="236" rx="8" fill="url(#${id}g)"/>
    <circle cx="120" cy="120" r="70" fill="${accent}" opacity=".18" filter="url(#${id}f)"/>
    <g stroke="#fff" stroke-opacity=".07"><path d="M92 24v236M128 24v236M164 24v236M56 70h128M56 130h128M56 190h128"/></g>
    ${fan(82, 62)}${fan(82, 116)}${fan(82, 170)}
    <rect x="108" y="46" width="62" height="60" rx="5" fill="#101727" stroke="#fff" stroke-opacity=".1"/>
    <circle cx="132" cy="74" r="15" fill="#080b13" stroke="${accent}" stroke-width="2"/>
    <circle cx="132" cy="74" r="6" fill="${accent}" fill-opacity=".7"/>
    <rect x="150" y="50" width="4" height="30" rx="1.5" fill="${accent}" opacity=".85"/><rect x="157" y="50" width="4" height="30" rx="1.5" fill="${accent}" opacity=".6"/>
    <rect x="102" y="150" width="78" height="26" rx="4" fill="#0a0f1b" stroke="${accent}" stroke-opacity=".7" stroke-width="1.5"/>
    <circle cx="124" cy="163" r="8" fill="none" stroke="${accent}" stroke-opacity=".8"/><circle cx="154" cy="163" r="8" fill="none" stroke="${accent}" stroke-opacity=".8"/>
    <rect x="56" y="226" width="128" height="34" rx="6" fill="#06090f"/>
    <circle cx="88" cy="243" r="9" fill="none" stroke="#fff" stroke-opacity=".14"/>
    <path d="M110 243h56" stroke="${accent}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    <circle cx="120" cy="19" r="2.2" fill="${accent}"/>
  </svg>`;
}

export const BUILD_ACCENTS = ["#2f6fed", "#e4342f", "#7a4cf0", "#1f9d6b", "#e08a1b"];
export function buildMediaHTML(b, index = 0) {
  const src = imgSrc(b.image);
  if (src) return `<img src="${esc(src)}" alt="${esc(loc(b.name))}" loading="lazy" decoding="async">`;
  return `<div class="ph ph-tower">${towerArt(BUILD_ACCENTS[index % BUILD_ACCENTS.length])}</div>`;
}

/* ------------------------------------------------------------------- toast */
export function toast(message, opts = {}) {
  let host = document.getElementById("toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    host.setAttribute("role", "status");
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = `toast${opts.kind ? ` toast-${opts.kind}` : ""}`;
  el.innerHTML = `<span>${esc(message)}</span>${opts.href ? `<a href="${esc(opts.href)}">${esc(opts.label || "")}</a>` : ""}`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  setTimeout(() => { el.classList.remove("in"); setTimeout(() => el.remove(), 250); }, opts.ms || 3200);
}

/** Add to cart + toast with a "View cart" link. Returns true if added. */
export function addToCart(id, qty = 1) {
  const p = getProduct(id);
  if (!p) return false;
  if (p.stock === "out" || p.stock === "soon") {
    toast(T("shop.unavailable"), { kind: "warn" });
    return false;
  }
  cart.add(id, qty);
  toast(T("shop.addedToCart"), { href: "/cart", label: T("shop.viewCart") });
  return true;
}

/* ------------------------------------------------------------------- modal */
/** A simple accessible dialog. Returns { el, body, close }. Esc, the backdrop and any [data-close] button close it. */
export function openModal({ title = "", wide = false, className = "" } = {}) {
  const previouslyFocused = document.activeElement;
  const el = document.createElement("div");
  el.className = `modal ${className}`.trim();
  el.innerHTML = `<div class="modal-back" data-close></div>
    <div class="modal-box${wide ? " is-wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="modal-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="${esc(T("shop.close"))}">${icon("close")}</button></header>
      <div class="modal-body"></div>
    </div>`;
  document.body.appendChild(el);
  document.body.classList.add("no-scroll");
  const api = {
    el,
    body: el.querySelector(".modal-body"),
    close() {
      el.remove();
      if (!document.querySelector(".modal")) document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey);
      api.onClose?.();
      previouslyFocused?.focus?.();
    },
  };
  const onKey = (e) => { if (e.key === "Escape" && el === [...document.querySelectorAll(".modal")].pop()) api.close(); };
  document.addEventListener("keydown", onKey);
  el.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) api.close(); });
  el.querySelector(".modal-head .icon-btn").focus();
  return api;
}
