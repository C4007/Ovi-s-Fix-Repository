/* ==========================================================================
   Ovi's Fix — shop-ui.js
   Product cards + the listing engine (search, availability / price / brand
   filters, and the category-specific filters from catalog-schema.js).
   The same engine powers /shop/*, /components, /offers and the PC Builder's
   "Choose" window, so a filter works the same way everywhere.
   ========================================================================== */

import { SUBS, CATEGORIES, STOCK, VALUE_BN, catOfSub, formatSpecValue, bucketLabel } from "./catalog-schema.js";
import {
  T, lang, loc, esc, money, priceText, priceInfo, shop, productUrl, subLabel, catLabel, stockLabel, mediaHTML, addToCart, offerActive, offerAppliesTo,
} from "./shop-core.js";
import { icon } from "./icons.js";

/* ------------------------------------------------------------ spec helpers */
/** Technical values (DDR4, AM5, LGA1200, NVMe, M.2, WiFi 6, Windows 11 …) are never translated.
 *  Only a few plain words (colors, "Included", sizes) have a Bangla form — see VALUE_BN. */
export const tv = (v) => (lang() === "bn" && VALUE_BN[v]) || v;

/** Display values of one spec for one product (a list, so multi-value specs filter correctly). */
export function valuesOf(p, def) {
  const v = p.specs?.[def.key];
  if (v === undefined || v === null || v === "") return [];
  if (def.type === "bucket") {
    const b = bucketLabel(def, v);
    return b ? [b] : [];
  }
  return (Array.isArray(v) ? v : [v]).map((x) => formatSpecValue(def, x)).filter(Boolean);
}

/** The few specs shown on a product card. */
export function cardSpecs(p, max = 4) {
  const out = [];
  for (const def of SUBS[p.sub]?.filters || []) {
    if (!def.card) continue;
    const vals = valuesOf(p, def);
    if (!vals.length) continue;
    // Show the raw number for buckets (e.g. "7,400 MB/s") rather than the range label.
    const text = def.type === "bucket" ? formatSpecValue(def, p.specs[def.key]).replace(/(\d)(?=(\d{3})+$)/, "$1,") : "";
    out.push({ label: loc(def.label), value: def.type === "bucket" ? text : vals.map(tv).join(", ") });
    if (out.length >= max) break;
  }
  return out;
}

/** Every spec of a product, in filter order — for the product page table. */
export function allSpecs(p) {
  const out = [];
  for (const def of SUBS[p.sub]?.filters || []) {
    const v = p.specs?.[def.key];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) continue;
    out.push({ label: loc(def.label), value: def.type === "bucket" ? formatSpecValue(def, v) : valuesOf(p, def).map(tv).join(", ") });
  }
  return out;
}

/* ---------------------------------------------------------------- the card */
export function stockPill(p) {
  return `<span class="stock stock-${p.stock}">${esc(stockLabel(p.stock))}</span>`;
}

export function defaultAction(p) {
  const out = p.stock === "out" || p.stock === "soon";
  const label = p.stock === "pre" ? T("shop.preorder") : p.stock === "in" ? T("shop.addToCart") : stockLabel(p.stock);
  return `<button type="button" class="btn btn-primary btn-sm" data-add="${esc(p.id)}" ${out ? "disabled" : ""}>${out ? "" : icon("cart")}<span>${esc(label)}</span></button>`;
}

export function priceBlock(p) {
  const info = priceInfo(p);
  return `<div class="price"><strong>${esc(priceText(info.price))}</strong>${info.onSale ? `<s>${money(info.regular)}</s>` : ""}</div>`;
}

export function productCard(p, opts = {}) {
  const info = priceInfo(p);
  const specs = cardSpecs(p, 4);
  const action = opts.actionHTML ?? defaultAction(p);
  const note = opts.noteHTML || "";
  const tgt = opts.newTab ? ' target="_blank" rel="noopener"' : "";
  return `<article class="pcard${p.stock === "out" ? " is-out" : ""}" data-id="${esc(p.id)}">
    <a class="pcard-media" href="${productUrl(p)}"${tgt} aria-label="${esc(p.name)}">${mediaHTML(p)}${info.onSale ? `<span class="tag-sale">−${info.pct}%</span>` : ""}</a>
    <div class="pcard-body">
      <div class="pcard-meta"><span>${esc(p.brand)}</span>${stockPill(p)}</div>
      <h3 class="pcard-title"><a href="${productUrl(p)}"${tgt}>${esc(p.name)}</a></h3>
      <ul class="pcard-specs">${specs.map((s) => `<li><span>${esc(s.label)}</span>${esc(s.value)}</li>`).join("")}</ul>
      ${note}
      <div class="pcard-foot">${priceBlock(p)}${action}</div>
    </div>
  </article>`;
}

function tableRow(p, opts = {}) {
  const specs = cardSpecs(p, 3).map((s) => esc(s.value)).join(" · ");
  return `<tr data-id="${esc(p.id)}" class="${p.stock === "out" ? "is-out" : ""}">
    <td class="t-name"><a href="${productUrl(p)}">${esc(p.name)}</a><small>${esc(p.brand)}${specs ? ` · ${specs}` : ""}</small></td>
    <td class="t-cat">${esc(subLabel(p.sub))}</td>
    <td class="t-stock">${stockPill(p)}</td>
    <td class="t-price">${priceBlock(p)}</td>
    <td class="t-act">${opts.actionHTML ?? defaultAction(p)}</td>
  </tr>`;
}

/* ------------------------------------------------------------ filter engine */
const tokens = (q) => String(q || "").toLowerCase().split(/\s+/).filter(Boolean);
function haystack(p) {
  const specVals = Object.values(p.specs || {}).flat().join(" ");
  return `${p.name} ${p.brand} ${subLabel(p.sub)} ${SUBS[p.sub]?.label?.en || ""} ${specVals}`.toLowerCase();
}

const SORTS = ["featured", "price-asc", "price-desc", "newest", "discount"];
const naturalSort = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });

function freshState(cfg) {
  return { q: "", cat: "", sub: cfg.fixedSub || "", brands: new Set(), avail: new Set(), min: null, max: null, specs: {}, sort: cfg.defaultSort || "featured", page: 1, sale: !!cfg.onlyOnSale, offer: "", compatOnly: true };
}

export function mountListing(root, cfg) {
  const subsAll = cfg.subs && cfg.subs.length ? cfg.subs : Object.keys(SUBS);
  const fixedSub = subsAll.length === 1 ? subsAll[0] : "";
  cfg = { urlSync: true, pageSize: 24, listView: "rows", ...cfg, fixedSub };
  const st = freshState(cfg);
  const open = new Map(); // remembered open/closed state of each facet
  const expanded = new Set(); // facets whose "show more" list is expanded
  // Each kind of page remembers its own grid/list choice; the stock & price list starts as a list.
  const viewKey = `ovisfix-view-${cfg.viewKey || "shop"}`;
  let view = (() => { try { return localStorage.getItem(viewKey) || ""; } catch (e) { return ""; } })() || cfg.defaultView || "grid";
  if (cfg.forceView) view = cfg.forceView;
  let compat = cfg.compat || null;
  // "hide": incompatible parts never appear (and never count in the filters). "toggle": a checkbox lets the user show them.
  const compatMode = () => (compat ? cfg.compatMode || "toggle" : null);
  const hideIncompat = () => compat && (compatMode() === "hide" || st.compatOnly);

  /* ---- URL <-> state ---- */
  const subFromPath = () => {
    const m = /^\/shop\/([a-z-]+)\/([a-z0-9-]+)\/?$/.exec(location.pathname);
    return m && subsAll.includes(m[2]) ? m[2] : "";
  };
  function readURL() {
    if (!cfg.urlSync) return;
    const sp = new URLSearchParams(location.search);
    st.q = sp.get("q") || "";
    st.cat = cfg.catTabs && CATEGORIES[sp.get("cat")] ? sp.get("cat") : "";
    st.sub = fixedSub || (cfg.pathMode ? subFromPath() : sp.get("sub")) || "";
    if (st.sub && !subsAll.includes(st.sub)) st.sub = "";
    if (st.sub && cfg.catTabs) st.cat = catOfSub(st.sub) || st.cat;
    st.brands = new Set((sp.get("brand") || "").split("|").filter(Boolean));
    st.avail = new Set((sp.get("avail") || "").split("|").filter((x) => STOCK[x]));
    st.min = sp.get("min") !== null && sp.get("min") !== "" ? Number(sp.get("min")) : null;
    st.max = sp.get("max") !== null && sp.get("max") !== "" ? Number(sp.get("max")) : null;
    st.sort = SORTS.includes(sp.get("sort")) ? sp.get("sort") : cfg.defaultSort || "featured";
    st.page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    st.sale = cfg.onlyOnSale || sp.get("sale") === "1";
    st.offer = sp.get("offer") || "";
    st.specs = {};
    for (const [k, v] of sp.entries()) if (k.startsWith("f.")) st.specs[k.slice(2)] = new Set(v.split("|").filter(Boolean));
  }
  function writeURL(push) {
    if (!cfg.urlSync) return;
    const sp = new URLSearchParams();
    if (st.q) sp.set("q", st.q);
    if (st.cat && cfg.catTabs) sp.set("cat", st.cat);
    if (st.sub && !cfg.pathMode && !fixedSub) sp.set("sub", st.sub);
    if (st.brands.size) sp.set("brand", [...st.brands].join("|"));
    if (st.avail.size) sp.set("avail", [...st.avail].join("|"));
    if (st.min !== null) sp.set("min", st.min);
    if (st.max !== null) sp.set("max", st.max);
    if (st.sort !== (cfg.defaultSort || "featured")) sp.set("sort", st.sort);
    if (st.page > 1) sp.set("page", st.page);
    if (st.sale && !cfg.onlyOnSale) sp.set("sale", "1");
    if (st.offer) sp.set("offer", st.offer);
    for (const [k, set] of Object.entries(st.specs)) if (set.size) sp.set(`f.${k}`, [...set].join("|"));
    const path = cfg.pathMode ? (st.sub ? `/shop/${cfg.cat}/${st.sub}` : `/shop/${cfg.cat}`) : location.pathname;
    const url = path + (sp.toString() ? `?${sp}` : "");
    if (url !== location.pathname + location.search) history[push ? "pushState" : "replaceState"](null, "", url);
  }

  /* ---- universe + matching ---- */
  const offerObj = () => (st.offer ? shop().offers.find((o) => o.id === st.offer) : null);
  function universe(ignoreCompat = false) {
    const subs = st.sub ? [st.sub] : st.cat ? CATEGORIES[st.cat].subs.filter((x) => subsAll.includes(x)) : subsAll;
    const off = offerObj();
    return shop().products.filter((p) => {
      if (!subs.includes(p.sub)) return false;
      if (cfg.filter && !cfg.filter(p)) return false;
      if (off && !(offerActive(off) && offerAppliesTo(off, p))) return false;
      if (st.sale && !priceInfo(p).onSale) return false;
      if (!ignoreCompat && hideIncompat() && !compat(p).ok) return false;
      return true;
    });
  }
  const defsOf = (sub) => SUBS[sub]?.filters || [];

  function matches(p, skip) {
    const t = tokens(st.q);
    if (t.length) { const h = haystack(p); if (!t.every((w) => h.includes(w))) return false; }
    if (skip !== "brand" && st.brands.size && !st.brands.has(p.brand)) return false;
    if (skip !== "avail" && st.avail.size && !st.avail.has(p.stock)) return false;
    if (skip !== "price") {
      const pr = priceInfo(p).price;
      if (st.min !== null && pr < st.min) return false;
      if (st.max !== null && pr > st.max) return false;
    }
    if (st.sub) {
      for (const [key, set] of Object.entries(st.specs)) {
        if (!set.size || skip === `spec:${key}`) continue;
        const def = defsOf(st.sub).find((d) => d.key === key);
        if (!def) continue;
        const vals = valuesOf(p, def);
        if (!vals.some((v) => set.has(v))) return false;
      }
    }
    return true;
  }

  function compare(a, b) {
    const sa = a.stock === "out" ? 1 : 0, sb = b.stock === "out" ? 1 : 0;
    if (sa !== sb) return sa - sb;
    const pa = priceInfo(a), pb = priceInfo(b);
    switch (st.sort) {
      case "price-asc": return pa.price - pb.price;
      case "price-desc": return pb.price - pa.price;
      case "newest": return b.createdAt - a.createdAt;
      case "discount": return pb.pct - pa.pct || pa.price - pb.price;
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || STOCK[a.stock].order - STOCK[b.stock].order || b.createdAt - a.createdAt;
    }
  }

  /* ---- facets ---- */
  function countValues(pool, getVals) {
    const m = new Map();
    for (const p of pool) for (const v of getVals(p)) m.set(v, (m.get(v) || 0) + 1);
    return m;
  }
  function orderedOptions(def, counts, selected) {
    const keys = new Set([...counts.keys(), ...selected]);
    let list = [...keys];
    if (def?.type === "bucket") {
      const order = def.buckets.map((b) => b[2]);
      return list.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
    if (def?.opts) {
      const order = def.opts.map((o) => formatSpecValue(def, o));
      return list.sort((a, b) => {
        const ia = order.indexOf(a), ib = order.indexOf(b);
        if (ia === -1 && ib === -1) return naturalSort(a, b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }
    return list.sort(naturalSort);
  }

  function facetHTML(id, title, options, counts, selectedSet, defaultOpen) {
    if (!options.length) return "";
    const isOpen = open.has(id) ? open.get(id) : defaultOpen;
    const LIMIT = 7;
    const visible = options.slice(0, LIMIT), rest = options.slice(LIMIT);
    const row = (o) => `<label class="check"><input type="checkbox" data-facet="${esc(id)}" value="${esc(o.value)}" ${selectedSet.has(o.value) ? "checked" : ""}><span>${esc(o.label)}</span><em>${counts.get(o.value) || 0}</em></label>`;
    return `<details class="facet" data-fid="${esc(id)}" ${isOpen ? "open" : ""}><summary>${esc(title)}</summary>
      <div class="facet-body">${visible.map(row).join("")}${rest.length ? `<div class="facet-more" ${expanded.has(id) ? "" : "hidden"}>${rest.map(row).join("")}</div><button type="button" class="link-btn" data-more="${esc(id)}" data-label="${esc(T("shop.showMore", { n: rest.length }))}">${esc(expanded.has(id) ? T("shop.showLess") : T("shop.showMore", { n: rest.length }))}</button>` : ""}</div></details>`;
  }

  function buildFacets(uni) {
    const html = [];
    // availability
    const availCounts = countValues(uni.filter((p) => matches(p, "avail")), (p) => [p.stock]);
    const availOpts = Object.keys(STOCK).filter((k) => availCounts.get(k) || st.avail.has(k)).map((k) => ({ value: k, label: stockLabel(k) }));
    html.push(facetHTML("avail", T("shop.availability"), availOpts, availCounts, st.avail, true));
    // price
    const prices = uni.map((p) => priceInfo(p).price).filter((n) => n > 0);
    const lo = prices.length ? Math.min(...prices) : 0, hi = prices.length ? Math.max(...prices) : 0;
    html.push(`<details class="facet" data-fid="price" ${open.has("price") ? (open.get("price") ? "open" : "") : "open"}><summary>${esc(T("shop.price"))}</summary>
      <div class="facet-body price-range"><label><span>${esc(T("shop.min"))}</span><input type="number" inputmode="numeric" min="0" data-price="min" placeholder="${lo}" value="${st.min ?? ""}"></label>
      <label><span>${esc(T("shop.max"))}</span><input type="number" inputmode="numeric" min="0" data-price="max" placeholder="${hi}" value="${st.max ?? ""}"></label></div></details>`);
    // brand
    const brandCounts = countValues(uni.filter((p) => matches(p, "brand")), (p) => [p.brand].filter(Boolean));
    const brandOpts = orderedOptions(null, brandCounts, st.brands).map((b) => ({ value: b, label: b }));
    html.push(facetHTML("brand", T("shop.brand"), brandOpts, brandCounts, st.brands, true));
    // category-specific
    if (st.sub) {
      let n = 0;
      for (const def of defsOf(st.sub)) {
        const sel = st.specs[def.key] || new Set();
        const pool = uni.filter((p) => matches(p, `spec:${def.key}`));
        const counts = countValues(pool, (p) => valuesOf(p, def));
        const opts = orderedOptions(def, counts, sel).filter((v) => counts.get(v) || sel.has(v)).map((v) => ({ value: v, label: tv(v) }));
        const h = facetHTML(`spec:${def.key}`, loc(def.label), opts, counts, sel, n < 3);
        if (h) n++;
        html.push(h);
      }
    }
    return html.join("");
  }

  /* ---- rendering ---- */
  root.innerHTML = `
    <div class="listing">
      <div class="subchips" data-r="chips"></div>
      <div class="listing-body">
        <aside class="filters" data-r="filters" aria-label="${esc(T("shop.filters"))}">
          <div class="filters-head"><strong>${esc(T("shop.filters"))}</strong>
            <button type="button" class="link-btn" data-clear>${esc(T("shop.clearAll"))}</button>
            <button type="button" class="icon-btn filters-close" data-fclose aria-label="${esc(T("shop.close"))}">${icon("close")}</button></div>
          <div class="facets" data-r="facets"></div>
          <div class="filters-foot"><button type="button" class="btn btn-primary btn-block" data-fclose data-r="showres"></button></div>
        </aside>
        <div class="results">
          <div class="toolbar">
            <button type="button" class="btn btn-secondary btn-sm filters-open" data-fopen>${icon("filter")}<span>${esc(T("shop.filters"))}</span><b data-r="fcount"></b></button>
            <div class="count" data-r="count" aria-live="polite"></div>
            <label class="search-inline">${icon("search")}<input type="search" data-search placeholder="${esc(T("shop.searchPlaceholder"))}" aria-label="${esc(T("shop.search"))}" value="${esc(st.q)}"></label>
            <label class="sort"><span>${esc(T("shop.sortBy"))}</span><select data-sort>${SORTS.map((s) => `<option value="${s}">${esc(T(`shop.sort.${s}`))}</option>`).join("")}</select></label>
            ${cfg.forceView ? "" : `<div class="view-toggle" role="group" aria-label="${esc(T("shop.view"))}"><button type="button" data-view="grid" aria-label="${esc(T("shop.viewGrid"))}">${icon("grid")}</button><button type="button" data-view="list" aria-label="${esc(T("shop.viewList"))}">${icon("list")}</button></div>`}
          </div>
          ${compat && compatMode() !== "hide" ? `<label class="check compat-toggle"><input type="checkbox" data-compat ${st.compatOnly ? "checked" : ""}><span>${esc(T("shop.compatOnly"))}</span><em data-r="hidden"></em></label>` : ""}
          <div class="chips" data-r="active"></div>
          <div data-r="items"></div>
          <nav class="pager" data-r="pager" aria-label="${esc(T("shop.pagination"))}"></nav>
        </div>
      </div>
    </div>`;
  const $ = (name) => root.querySelector(`[data-r="${name}"]`);
  const el = { chips: $("chips"), filters: $("filters"), facets: $("facets"), count: $("count"), items: $("items"), pager: $("pager"), active: $("active"), fcount: $("fcount"), showres: $("showres"), hidden: $("hidden") };
  const searchInput = root.querySelector("[data-search]");
  const sortSel = root.querySelector("[data-sort]");

  function activeChips() {
    const chips = [];
    const add = (label, onRemove) => chips.push({ label, onRemove });
    if (st.q) add(`“${st.q}”`, () => { st.q = ""; searchInput.value = ""; });
    st.brands.forEach((b) => add(b, () => st.brands.delete(b)));
    st.avail.forEach((a) => add(stockLabel(a), () => st.avail.delete(a)));
    if (st.min !== null) add(`≥ ${money(st.min)}`, () => { st.min = null; });
    if (st.max !== null) add(`≤ ${money(st.max)}`, () => { st.max = null; });
    for (const [k, set] of Object.entries(st.specs)) set.forEach((v) => add(tv(v), () => set.delete(v)));
    if (st.sale && !cfg.onlyOnSale) add(T("shop.onSale"), () => { st.sale = false; });
    if (st.offer) { const o = offerObj(); add(o ? loc(o.title) : T("shop.offer"), () => { st.offer = ""; }); }
    return chips;
  }

  let chipActions = [];
  function render(scrollTop) {
    const uni = universe();
    const list = uni.filter((p) => matches(p, null)).sort(compare);
    const hiddenIncompat = compatMode() === "toggle" && st.compatOnly ? universe(true).filter((p) => matches(p, null) && !compat(p).ok).length : 0;
    const pages = Math.max(1, Math.ceil(list.length / cfg.pageSize));
    if (st.page > pages) st.page = pages;
    const pageItems = list.slice((st.page - 1) * cfg.pageSize, st.page * cfg.pageSize);

    // category + sub-category chips
    const baseAll = shop().products.filter((p) => subsAll.includes(p.sub) && (!cfg.filter || cfg.filter(p)) && !(compatMode() === "hide" && !compat(p).ok));
    const chipBtn = (attr, val, on, label, count, ic) => `<button type="button" class="chip ${on ? "is-on" : ""}" data-chip-${attr}="${val}">${ic ? icon(ic) : ""}${esc(label)}<em>${count}</em></button>`;
    let chipsHTML = "";
    if (cfg.catTabs) {
      const byCat = countValues(baseAll, (p) => [catOfSub(p.sub)]);
      chipsHTML += `<div class="chiprow">${chipBtn("cat", "", !st.cat, T("shop.all"), baseAll.length)}${Object.keys(CATEGORIES).filter((c) => byCat.get(c)).map((c) => chipBtn("cat", c, st.cat === c, catLabel(c), byCat.get(c), CATEGORIES[c].icon)).join("")}</div>`;
    }
    const chipSubs = cfg.catTabs ? (st.cat ? CATEGORIES[st.cat].subs.filter((x) => subsAll.includes(x)) : []) : subsAll;
    if (!fixedSub && chipSubs.length > 1) {
      const pool = baseAll.filter((p) => chipSubs.includes(p.sub));
      const counts = countValues(pool, (p) => [p.sub]);
      chipsHTML += `<div class="chiprow">${chipBtn("sub", "", !st.sub, T("shop.all"), pool.length)}${chipSubs.filter((x) => counts.get(x)).map((x) => chipBtn("sub", x, st.sub === x, subLabel(x), counts.get(x), SUBS[x].icon)).join("")}</div>`;
    }
    el.chips.innerHTML = chipsHTML;

    el.facets.innerHTML = buildFacets(uni) + (!st.sub && (st.cat ? CATEGORIES[st.cat].subs.length : subsAll.length) > 1 ? `<p class="facet-hint">${esc(T("shop.chooseTypeForFilters"))}</p>` : "");
    const chips = activeChips();
    chipActions = chips.map((c) => c.onRemove);
    el.active.innerHTML = chips.length ? chips.map((c, i) => `<button type="button" class="chip chip-x" data-x="${i}">${esc(c.label)}${icon("close")}</button>`).join("") : "";
    el.fcount.textContent = chips.length ? String(chips.length) : "";
    el.count.textContent = T("shop.results", { n: list.length });
    el.showres.textContent = T("shop.showResults", { n: list.length });
    if (el.hidden) el.hidden.textContent = hiddenIncompat ? T("shop.hiddenIncompatible", { n: hiddenIncompat }) : "";
    sortSel.value = st.sort;
    root.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("is-on", b.dataset.view === (view === "grid" ? "grid" : "list")));

    // items
    if (!pageItems.length && !uni.length && cfg.emptyHTML) {
      el.items.innerHTML = cfg.emptyHTML();
    } else if (!pageItems.length) {
      el.items.innerHTML = `<div class="empty"><div class="empty-ic">${icon("search")}</div><h3>${esc(T("shop.noResults"))}</h3><p>${esc(T("shop.noResultsHint"))}</p><button type="button" class="btn btn-secondary btn-sm" data-clear>${esc(T("shop.clearAll"))}</button></div>`;
    } else {
      const actionFor = (p) => {
        if (!cfg.action) return { newTab: cfg.newTab };
        const c = compat ? compat(p) : { ok: true };
        const a = cfg.action(p, c);
        return { newTab: cfg.newTab, actionHTML: a?.html, noteHTML: c.ok ? (c.warn ? `<p class="pnote warn">${icon("alert")}${esc(c.warn)}</p>` : "") : `<p class="pnote bad">${icon("alert")}${esc(c.reason || T("shop.notCompatible"))}</p>` };
      };
      if (view === "grid") {
        el.items.innerHTML = `<div class="pgrid">${pageItems.map((p) => productCard(p, actionFor(p))).join("")}</div>`;
      } else if (cfg.listView === "table") {
        el.items.innerHTML = `<div class="ptable-wrap"><table class="ptable"><thead><tr><th>${esc(T("shop.product"))}</th><th>${esc(T("shop.category"))}</th><th>${esc(T("shop.availability"))}</th><th class="num">${esc(T("shop.price"))}</th><th></th></tr></thead><tbody>${pageItems.map((p) => tableRow(p, actionFor(p))).join("")}</tbody></table></div>`;
      } else {
        el.items.innerHTML = `<div class="prows">${pageItems.map((p) => productCard(p, actionFor(p))).join("")}</div>`;
      }
    }

    // pager
    if (pages > 1) {
      const nums = [];
      for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - st.page) <= 1) nums.push(i);
      let html = `<button type="button" data-goto="${st.page - 1}" ${st.page === 1 ? "disabled" : ""}>${esc(T("shop.prev"))}</button>`;
      let prev = 0;
      for (const n of nums) { if (n - prev > 1) html += `<span class="gap">…</span>`; html += `<button type="button" data-goto="${n}" ${n === st.page ? 'aria-current="page" class="is-on"' : ""}>${n}</button>`; prev = n; }
      html += `<button type="button" data-goto="${st.page + 1}" ${st.page === pages ? "disabled" : ""}>${esc(T("shop.next"))}</button>`;
      el.pager.innerHTML = html;
    } else el.pager.innerHTML = "";

    if (scrollTop) root.querySelector(".results").scrollIntoView({ behavior: "smooth", block: "start" });
    cfg.onRender?.({ total: list.length, state: st });
  }

  function update({ push = false, resetPage = true, scrollTop = false } = {}) {
    if (resetPage) st.page = 1;
    writeURL(push);
    render(scrollTop);
  }

  /* ---- events ---- */
  let searchTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { st.q = searchInput.value.trim(); update(); }, 180);
  });
  sortSel.addEventListener("change", () => { st.sort = sortSel.value; update(); });

  root.addEventListener("click", (e) => {
    const t = e.target.closest("button, a, label");
    if (!t) return;
    const add = e.target.closest("[data-add]");
    if (add) { addToCart(add.dataset.add); return; }
    const pick = e.target.closest("[data-pick]");
    if (pick) { cfg.onPick?.(pick.dataset.pick, compat ? compat(shop().byId.get(pick.dataset.pick)) : { ok: true }); return; }
    const catChip = e.target.closest("[data-chip-cat]");
    if (catChip) { st.cat = catChip.dataset.chipCat; st.sub = ""; st.specs = {}; update({ push: true }); return; }
    const sub = e.target.closest("[data-chip-sub]");
    if (sub) { st.sub = sub.dataset.chipSub; st.specs = {}; update({ push: true }); return; }
    const x = e.target.closest("[data-x]");
    if (x) { chipActions[Number(x.dataset.x)]?.(); update(); return; }
    if (e.target.closest("[data-clear]")) { Object.assign(st, { q: "", brands: new Set(), avail: new Set(), min: null, max: null, specs: {}, offer: "", sale: !!cfg.onlyOnSale }); searchInput.value = ""; update(); return; }
    const pg = e.target.closest("[data-goto]");
    if (pg && !pg.disabled) { st.page = Number(pg.dataset.goto); update({ resetPage: false, scrollTop: true }); return; }
    const more = e.target.closest("[data-more]");
    if (more) {
      const box = more.previousElementSibling;
      box.hidden = !box.hidden;
      if (box.hidden) expanded.delete(more.dataset.more); else expanded.add(more.dataset.more);
      more.textContent = box.hidden ? more.dataset.label : T("shop.showLess");
      return;
    }
    const v = e.target.closest("[data-view]");
    if (v) { view = v.dataset.view === "grid" ? "grid" : "list"; try { localStorage.setItem(viewKey, view); } catch (err) { /* ignore */ } render(); return; }
    if (e.target.closest("[data-fopen]")) { el.filters.classList.add("is-open"); document.body.classList.add("no-scroll"); return; }
    if (e.target.closest("[data-fclose]")) { el.filters.classList.remove("is-open"); document.body.classList.remove("no-scroll"); }
  });

  root.addEventListener("change", (e) => {
    const cb = e.target.closest("input[data-facet]");
    if (cb) {
      const id = cb.dataset.facet;
      const set = id === "brand" ? st.brands : id === "avail" ? st.avail : (st.specs[id.slice(5)] ||= new Set());
      cb.checked ? set.add(cb.value) : set.delete(cb.value);
      update();
      return;
    }
    const price = e.target.closest("input[data-price]");
    if (price) { const n = price.value === "" ? null : Math.max(0, Number(price.value)); st[price.dataset.price] = Number.isFinite(n) ? n : null; update(); return; }
    if (e.target.matches("[data-compat]")) { st.compatOnly = e.target.checked; update({ resetPage: true }); }
  });
  root.addEventListener("toggle", (e) => {
    const d = e.target.closest?.("details.facet");
    if (d) open.set(d.dataset.fid, d.open);
  }, true);

  const onPop = () => { readURL(); render(); };
  const onLang = () => { render(); };
  if (cfg.urlSync) window.addEventListener("popstate", onPop);
  document.addEventListener("ovisfix:languagechange", onLang);

  readURL();
  if (cfg.initialSub && !st.sub && subsAll.includes(cfg.initialSub)) st.sub = cfg.initialSub;
  render();

  return {
    state: st,
    refresh: () => render(),
    setCompat(fn) { compat = fn; render(); },
    destroy() { window.removeEventListener("popstate", onPop); document.removeEventListener("ovisfix:languagechange", onLang); document.body.classList.remove("no-scroll"); },
  };
}

/* ------------------------------------------------------------ shared blocks */
/** Small horizontal strip of cards (home, shop hub, product page "related"). */
export function productStrip(products) {
  return `<div class="pgrid">${products.map((p) => productCard(p)).join("")}</div>`;
}

/** Wire up [data-add] buttons inside a static container (strips that are not full listings). */
export function wireAddButtons(root) {
  root.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) addToCart(add.dataset.add);
  });
}

export { CATEGORIES, catLabel, catOfSub };
