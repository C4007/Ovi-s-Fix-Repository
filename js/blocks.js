/* ==========================================================================
   Ovi's Fix — blocks.js
   Small HTML building blocks several pages share: page header with
   breadcrumbs, category tiles, pre-built PC cards, offer cards, the
   "free service" promise ticket and the PC Builder call-to-action.
   ========================================================================== */

import { CATEGORIES, BUILDER_ROWS } from "./catalog-schema.js";
import {
  T, loc, esc, money, shop, cart, toast, waLink, buildParts, buildPrice, buildMediaHTML, catLabel, catUrl, offerActive, priceInfo,
} from "./shop-core.js";
import { icon } from "./icons.js";
import { selectionFromParts, estimateWatts, analyzeBalance, ROW } from "./builder-logic.js";

export const BUILDER_KEY = "ovisfix-builder";

/* ------------------------------------------------------------- page header */
export function pageHeader({ crumbs = [], title, lead = "", actions = "", badge = "" }) {
  const trail = [{ href: "/home", label: T("nav.home") }, ...crumbs];
  return `<header class="page-head">
    <div class="container">
      <nav class="crumbs" aria-label="Breadcrumb">${trail.map((c, i) => (i === trail.length - 1 && !c.href ? `<span aria-current="page">${esc(c.label)}</span>` : `<a href="${c.href}">${esc(c.label)}</a>`)).join(`<i aria-hidden="true">/</i>`)}</nav>
      ${title ? `<div class="page-head-row"><div><h1>${esc(title)}${badge ? ` <span class="beta-chip">${esc(badge)}</span>` : ""}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ""}</div>${actions ? `<div class="page-head-actions">${actions}</div>` : ""}</div>` : ""}
    </div>
  </header>`;
}

export function sectionHead(title, href, linkText) {
  return `<div class="sec-head"><h2>${esc(title)}</h2>${href ? `<a class="link-more" href="${href}">${esc(linkText || T("shop.viewAll"))}${icon("chevron")}</a>` : ""}</div>`;
}

/* ------------------------------------------------------------ category tile */
export function categoryTile(cat, count) {
  const c = CATEGORIES[cat];
  return `<a class="cat-tile" href="${catUrl(cat)}">
    <span class="cat-ic">${icon(c.icon)}</span>
    <span class="cat-name">${esc(catLabel(cat))}</span>
    <span class="cat-blurb">${esc(loc(c.blurb))}</span>
    <span class="cat-count">${esc(T("shop.productsCount", { n: count }))}</span>
  </a>`;
}

/* ------------------------------------------------------ the free-service ticket */
export function promiseTicket(store) {
  return `<aside class="ticket promise" aria-label="${esc(T("shop.promiseLabel"))}">
    <div class="ticket-stamp"><strong>৳0</strong><span>${esc(T("shop.serviceCharge"))}</span></div>
    <div class="ticket-text">
      <p><strong>${esc(loc(store.freeServiceNote))}</strong></p>
      <p>${esc(loc(store.preorderNote))} <a href="/terms#shop-terms">${esc(loc(store.tcNote))}</a></p>
    </div>
  </aside>`;
}

/* --------------------------------------------------- builder call-to-action */
export function builderCta() {
  const rows = ["cpu", "mobo", "ram", "gpu"].map((k) => `<div class="mini-row"><span>${icon(ROW[k].icon)}${esc(loc(ROW[k].label))}</span><b>${esc(T("builder.choose"))}</b></div>`).join("");
  return `<section class="band band-builder"><div class="container band-grid">
    <div>
      <h2>${esc(T("home.builderTitle"))} <sup class="beta">Beta</sup></h2>
      <p class="lead">${esc(T("home.builderLead"))}</p>
      <ul class="tick-list">
        <li>${icon("check")}${esc(T("home.builderPoint1"))}</li>
        <li>${icon("check")}${esc(T("home.builderPoint2"))}</li>
        <li>${icon("check")}${esc(T("home.builderPoint3"))}</li>
      </ul>
      <a class="btn btn-primary" href="/pc-builder">${esc(T("home.openBuilder"))}</a>
    </div>
    <div class="mini-sheet" aria-hidden="true">${rows}<div class="mini-total"><span>${icon("bolt")}${esc(T("builder.estWattage"))}</span><b>— W</b></div></div>
  </div></section>`;
}

/* -------------------------------------------------------- pre-built PC card */
export function balanceChip(sel, byId, useCase = "gaming-1080") {
  const r = analyzeBalance(sel, byId, useCase);
  const map = { none: ["", ""], igpu: ["builder.bal.igpuShort", "info"], balanced: ["builder.bal.balancedShort", "good"], "gpu-limited": ["builder.bal.gpuLimitedShort", "good"], mild: ["builder.bal.mildShort", "warn"], moderate: ["builder.bal.moderateShort", "warn"], severe: ["builder.bal.severeShort", "bad"] };
  const [key, tone] = map[r.state] || ["", ""];
  return key ? { text: T(key), tone } : null;
}

export function buildCard(b, index = 0) {
  const { byId } = shop();
  const parts = buildParts(b);
  const price = buildPrice(b);
  const sel = selectionFromParts(b.parts, byId);
  const watts = estimateWatts(sel, byId);
  const bal = balanceChip(sel, byId, b.useCase === "creator" ? "creator" : "gaming-1080");
  const keyRows = ["cpu", "gpu", "ram", "storage", "mobo"].map((k) => {
    const hit = parts.find((x) => ROW[k].subs.includes(x.p.sub));
    return hit ? `<li><span>${esc(loc(ROW[k].label))}</span><b title="${esc(hit.p.name)}">${esc(hit.p.name)}</b></li>` : "";
  }).join("");
  const hasGpu = parts.some((x) => x.p.sub === "graphics-card");
  return `<article class="bcard" data-build="${esc(b.id)}">
    <div class="bcard-media">${buildMediaHTML(b, index)}${b.badge ? `<span class="badge-chip">${esc(b.badge)}</span>` : ""}</div>
    <div class="bcard-body">
      <h3>${esc(loc(b.name))}</h3>
      <p class="bcard-tag">${esc(loc(b.tagline))}</p>
      <ul class="bcard-parts">${keyRows}${hasGpu ? "" : `<li><span>${esc(loc(ROW.gpu.label))}</span><b>${esc(T("builds.integrated"))}</b></li>`}</ul>
      ${(b.highlights || []).length ? `<ul class="bcard-hl">${b.highlights.slice(0, 3).map((h) => `<li>${icon("check")}${esc(loc(h))}</li>`).join("")}</ul>` : ""}
      <div class="bcard-chips"><span class="chip-static">${icon("bolt")}${esc(T("builds.estWatts", { w: watts.total }))}</span>${bal ? `<span class="chip-static tone-${bal.tone}">${esc(bal.text)}</span>` : ""}</div>
      <div class="bcard-foot">
        <div class="price"><small>${esc(T("builds.priceFrom"))}</small><strong>${money(price.price)}</strong>${price.missing ? `<em class="warn-text">${esc(T("builds.partsMissing"))}</em>` : ""}</div>
        <p class="free-note">${icon("check")}${esc(T("builds.freeService"))}</p>
      </div>
      <div class="bcard-actions">
        <button type="button" class="btn btn-primary btn-sm" data-bact="cart" data-id="${esc(b.id)}">${icon("cart")}<span>${esc(T("shop.addToCart"))}</span></button>
        <button type="button" class="btn btn-secondary btn-sm" data-bact="customize" data-id="${esc(b.id)}">${icon("wrench")}<span>${esc(T("builds.customize"))}</span></button>
        <button type="button" class="btn btn-ghost btn-sm" data-bact="wa" data-id="${esc(b.id)}" aria-label="${esc(T("shop.askExpert"))}" title="${esc(T("shop.askExpert"))}">${icon("whatsapp")}</button>
      </div>
    </div>
  </article>`;
}

/** Event wiring for pre-built PC cards (delegated, so it survives re-rendering). */
export function wireBuildCards(root) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-bact]");
    if (!btn) return;
    const b = shop().builds.find((x) => x.id === btn.dataset.id);
    if (!b) return;
    const act = btn.dataset.bact;
    if (act === "customize") {
      const sel = selectionFromParts(b.parts, shop().byId);
      try { localStorage.setItem(BUILDER_KEY, JSON.stringify(sel)); } catch (err) { /* ignore */ }
      location.href = "/pc-builder";
    } else if (act === "cart") {
      const items = buildParts(b).filter((x) => x.p.stock !== "out" && x.p.stock !== "soon");
      if (items.length < (b.parts || []).length) { toast(T("builds.someUnavailable"), { kind: "warn" }); }
      if (!items.length) return;
      cart.addMany(items.map((x) => ({ id: x.p.id, qty: x.qty })));
      cart.setMeta({ fromBuilder: true });
      toast(T("builds.addedBuild"), { href: "/cart", label: T("shop.viewCart") });
    } else if (act === "wa") {
      const price = buildPrice(b);
      const lines = buildParts(b).map((x) => `${x.qty} x ${x.p.name}`);
      const text = `Hi Ovi's Fix, I'm interested in the "${b.name.en}" pre-built PC (${money(price.price)}).\n\n${lines.join("\n")}\n\nCan you confirm availability and delivery time?`;
      window.open(waLink(text), "_blank", "noopener");
    }
  });
}

/* ------------------------------------------------------------- offer cards */
const fmtDay = (str) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str || "");
  if (!m) return "";
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export function offerCard(o) {
  const href = o.kind === "discount" ? `/offers?offer=${encodeURIComponent(o.id)}` : o.link || "/shop";
  const ends = o.endsAt ? T("offers.endsOn", { date: fmtDay(o.endsAt) }) : T("offers.alwaysOn");
  const cta = o.kind === "discount" ? T("offers.shopOffer") : T("offers.learnMore");
  const sub = loc(o.subtitle);
  return `<a class="offer-card kind-${o.kind}" href="${esc(href)}">
    <span class="offer-badge">${icon(o.kind === "discount" ? "percent" : "check")}${esc(o.badge || (o.kind === "discount" ? (o.type === "percent" ? `${o.value}% off` : `${money(o.value)} off`) : T("offers.perk")))}</span>
    <h3>${esc(loc(o.title))}</h3>
    ${sub ? `<p>${esc(sub)}</p>` : ""}
    <span class="offer-foot"><em>${icon("clock")}${esc(ends)}</em><b>${esc(cta)}${icon("chevron")}</b></span>
  </a>`;
}

export const liveOffers = () => shop().offers.filter((o) => offerActive(o));

/** Products currently selling below their regular price (sale price or live offer), best discounts first. */
export function discountedProducts(limit = 8) {
  return shop().products
    .filter((p) => p.stock !== "out" && priceInfo(p).onSale)
    .sort((a, b) => priceInfo(b).pct - priceInfo(a).pct)
    .slice(0, limit);
}

export { BUILDER_ROWS };
