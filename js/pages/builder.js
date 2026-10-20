/* Ovi's Fix — /pc-builder (Beta)
   Pick parts row by row. Every choice is checked against the others, the page
   estimates wattage and CPU/GPU balance, and the finished build can be added to
   the cart, saved, printed or saved as an image. */
import { boot } from "/js/boot.js";
import { T, loc, esc, money, shop, cart, setPageMeta, priceInfo, mediaHTML, toast, openModal, shortName, productUrl, waLink } from "/js/shop-core.js";
import { BUILDER_ROWS } from "/js/catalog-schema.js";
import { icon } from "/js/icons.js";
import { mountListing, cardSpecs, stockPill, tv } from "/js/shop-ui.js";
import { pageHeader, BUILDER_KEY } from "/js/blocks.js";
import {
  ROW, emptySelection, sanitizeSelection, flatten, missingRequired, estimateWatts, checkBuild, productCompat, analyzeBalance,
  USE_CASES, encodeSelection, decodeSelection, cpuScore, gpuScore, pruneForBoard, boardFit, BOARD_FILTERED_ROWS, platformOfBoard,
} from "/js/builder-logic.js";

const SAVED_KEY = "ovisfix-saved-builds";
let sel = emptySelection();
let useCase = "gaming-1080";
let hideEmpty = false;

const byId = () => shop().byId;
/** The chosen motherboard — the first and most important choice. */
const board = () => { const it = sel.mobo?.[0]; return it ? byId().get(it.id) || null : null; };
const unitPrice = (p) => priceInfo(p).price;
const lineTotal = (it) => { const p = byId().get(it.id); return p ? unitPrice(p) * it.qty : 0; };
const totalPrice = () => flatten(sel, byId()).reduce((s, x) => s + unitPrice(x.p) * x.qty, 0);
const itemCount = () => flatten(sel, byId()).reduce((s, x) => s + x.qty, 0);

/* ------------------------------------------------------------- persistence */
function persist() { try { localStorage.setItem(BUILDER_KEY, JSON.stringify(sel)); } catch (e) { /* ignore */ } }
function loadInitial() {
  const param = new URLSearchParams(location.search).get("b");
  let loaded = null;
  if (param) { loaded = decodeSelection(param); if (loaded) history.replaceState(null, "", location.pathname); }
  if (!loaded) { try { loaded = JSON.parse(localStorage.getItem(BUILDER_KEY) || "null"); } catch (e) { loaded = null; } }
  sel = sanitizeSelection(loaded || emptySelection(), byId());
}
const readSaved = () => { try { const a = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
const writeSaved = (a) => { try { localStorage.setItem(SAVED_KEY, JSON.stringify(a.slice(0, 20))); } catch (e) { /* ignore */ } };

/* -------------------------------------------------------------- selection ops */
function addItem(rowKey, id, replaceIndex = null) {
  const row = ROW[rowKey];
  const list = sel[rowKey];
  if (replaceIndex !== null && list[replaceIndex]) {
    const dupe = list.findIndex((x, i) => x.id === id && i !== replaceIndex);
    list[replaceIndex] = { id, qty: Math.min(list[replaceIndex].qty, row.qty) };
    if (dupe !== -1) list.splice(dupe, 1);
  } else {
    const existing = list.find((x) => x.id === id);
    if (existing) existing.qty = Math.min(row.qty, existing.qty + 1);
    else if (list.length < row.max) list.push({ id, qty: 1 });
    else list[list.length - 1] = { id, qty: 1 };
  }
  persist(); render();
}
function removeItem(rowKey, index) {
  sel[rowKey].splice(index, 1);
  persist(); render();
  if (rowKey === "mobo") toast(T("builder.boardRemoved"), { kind: "warn" });
}

/** Choosing (or swapping) the motherboard: parts that don't fit it are removed, and we say exactly which. */
function chooseBoard(id) {
  const prod = byId().get(id);
  const { sel: pruned, removed } = pruneForBoard(sel, prod, byId());
  sel = pruned;
  sel.mobo = [{ id, qty: 1 }];
  persist(); render();
  if (removed.length) toast(T("builder.removedForBoard", { list: removed.map((r) => shortName(r.p.name)).join(", ") }), { kind: "warn", ms: 7000 });
  else toast(T("builder.boardChosen"));
}
function setQty(rowKey, index, qty) { const row = ROW[rowKey]; sel[rowKey][index].qty = Math.min(row.qty, Math.max(1, qty)); persist(); render(); }

/* ------------------------------------------------------------------ analysis */
const issueText = (i) => loc(i.text);
const spec = (p, k) => p?.specs?.[k];
function analysis() {
  const issues = checkBuild(sel, byId());
  const watts = estimateWatts(sel, byId());
  const balance = analyzeBalance(sel, byId(), useCase);
  return { issues, watts, balance, missing: missingRequired(sel) };
}

function balanceText(b) {
  const uc = loc(USE_CASES[useCase].label);
  switch (b.state) {
    case "none": return T("builder.bal.none");
    case "igpu": return b.hasIgpu ? T("builder.bal.igpu") : T("builder.bal.needGpu");
    case "balanced": return T("builder.bal.balanced", { uc });
    case "gpu-limited": return T("builder.bal.gpuLimited", { pct: b.pct });
    case "mild": return T("builder.bal.mild", { pct: b.pct });
    case "moderate": return T("builder.bal.moderate", { pct: b.pct });
    default: return T("builder.bal.severe", { pct: b.pct });
  }
}
const balanceTone = (s) => ({ balanced: "good", "gpu-limited": "good", mild: "warn", moderate: "warn", severe: "bad", igpu: "info", none: "info" }[s] || "info");

/* --------------------------------------------------------------------- render */
function rowHTML(row, a) {
  const items = sel[row.key];
  const rowIssues = a.issues.filter((i) => i.rows.includes(row.key) && i.level !== "info");
  if (hideEmpty && !items.length) return "";
  const list = items.map((it, idx) => {
    const p = byId().get(it.id);
    const specs = cardSpecs(p, 3).map((s) => `<span>${esc(s.value)}</span>`).join("");
    const unit = unitPrice(p);
    return `<li class="bitem" data-row="${row.key}" data-idx="${idx}">
      <a class="bitem-media" href="${productUrl(p)}" target="_blank" rel="noopener">${mediaHTML(p)}</a>
      <div class="bitem-main"><a class="bitem-name" href="${productUrl(p)}" target="_blank" rel="noopener">${esc(p.name)}</a><div class="bitem-specs">${specs}${stockPill(p)}</div></div>
      ${row.qty > 1 ? `<div class="qty" role="group" aria-label="${esc(T("cart.qty"))}"><button type="button" data-qd="-1" aria-label="−">${icon("minus")}</button><output>${it.qty}</output><button type="button" data-qd="1" aria-label="+" ${it.qty >= row.qty ? "disabled" : ""}>${icon("plus")}</button></div>` : ""}
      <div class="bitem-price"><strong>${money(unit * it.qty)}</strong>${it.qty > 1 ? `<small>${money(unit)} × ${it.qty}</small>` : ""}</div>
      <div class="bitem-act"><button type="button" class="btn btn-secondary btn-sm" data-change>${esc(T("builder.change"))}</button><button type="button" class="icon-btn" data-remove aria-label="${esc(T("cart.remove"))}">${icon("close")}</button></div>
    </li>`;
  }).join("");
  const canAdd = items.length < row.max;
  const locked = !!row.needsBoard && !board();
  const action = locked
    ? `<button type="button" class="btn btn-outline" data-choose-board>${icon("lock")}<span>${esc(T("builder.chooseBoard"))}</span></button>`
    : !items.length
      ? `<button type="button" class="btn btn-outline" data-choose>${esc(T("builder.choose"))}</button>`
      : canAdd ? `<button type="button" class="btn btn-secondary btn-sm" data-choose>${icon("plus")}<span>${esc(T("builder.addAnother"))}</span></button>` : "";
  return `<section class="brow ${items.length ? "has-items" : ""} ${locked ? "is-locked" : ""}" data-rowkey="${row.key}">
    <div class="brow-head">
      <span class="brow-ic">${icon(locked ? "lock" : row.icon)}</span>
      <div class="brow-title"><strong>${esc(loc(row.label))}</strong>${row.required ? `<span class="req">${esc(T("builder.required"))}</span>` : ""}${row.key === "mobo" && !items.length ? `<span class="start">${esc(T("builder.startHere"))}</span>` : ""}${locked ? `<small class="lock-note">${esc(T("builder.lockedRow"))}</small>` : ""}</div>
      ${action}
    </div>
    ${items.length ? `<ul class="brow-items">${list}</ul>` : ""}
    ${rowIssues.map((i) => `<p class="pnote ${i.level === "error" ? "bad" : "warn"}">${icon("alert")}${esc(issueText(i))}</p>`).join("")}
  </section>`;
}

/** Shows the platform the motherboard sets (socket, brand, memory, size) — or the "start here" prompt. */
function platformHTML() {
  const b = board();
  if (!b) {
    return `<div class="start-banner"><span class="step-no">1</span><div><strong>${esc(T("builder.boardFirst"))}</strong><p>${esc(T("builder.boardFirstHint"))}</p></div><button type="button" class="btn btn-primary btn-sm" data-choose-board>${esc(T("builder.chooseBoard"))}</button></div>`;
  }
  const chips = [spec(b, "socket"), platformOfBoard(b), spec(b, "memType"), spec(b, "formFactor"), spec(b, "maxMem") ? `${spec(b, "maxMem")} GB max` : "", spec(b, "ramSlots") ? `${spec(b, "ramSlots")} RAM slots` : ""].filter(Boolean);
  return `<div class="platform-bar"><div class="pb-main"><span class="pb-label">${esc(T("builder.platform"))}</span><strong>${esc(shortName(b.name))}</strong>
    <span class="pb-chips">${chips.map((c) => `<b>${esc(tv(c))}</b>`).join("")}</span></div><p>${esc(T("builder.platformHint"))}</p></div>`;
}

function sideHTML(a) {
  const psu = flatten(sel, byId()).find((x) => x.row === "psu");
  const psuW = psu ? Number(psu.p.specs?.watts) || 0 : 0;
  const load = psuW ? Math.round((a.watts.total / psuW) * 100) : 0;
  const loadTone = load > 90 ? "bad" : load > 75 ? "warn" : "good";
  const b = a.balance;
  const tone = balanceTone(b.state);
  const pos = typeof b.value === "number" ? 50 + b.value / 2 : 50;
  const cpuItem = flatten(sel, byId()).find((x) => x.row === "cpu");
  const gpuItem = flatten(sel, byId()).find((x) => x.row === "gpu");
  const errors = a.issues.filter((i) => i.level === "error").length;
  const warns = a.issues.filter((i) => i.level === "warn").length;
  const compatList = a.issues.length
    ? `<ul class="issues">${a.issues.map((i) => `<li class="lv-${i.level}">${icon(i.level === "info" ? "info" : "alert")}<span>${esc(issueText(i))}</span></li>`).join("")}</ul>`
    : "";
  const status = !itemCount() ? T("builder.compat.empty") : errors ? T("builder.compat.errors", { n: errors }) : warns ? T("builder.compat.warns", { n: warns }) : a.missing.length ? T("builder.compat.noneYet") : T("builder.compat.ok");
  const statusTone = !itemCount() ? "info" : errors ? "bad" : warns ? "warn" : "good";
  return `
  <section class="scard"><h3>${icon("bolt")}${esc(T("builder.power"))} <sup class="beta">Beta</sup></h3>
    <div class="power-num"><strong>${a.watts.total}</strong><span>W</span><small>${esc(T("builder.estWattage"))}</small></div>
    ${a.watts.recommended ? `<p class="power-rec">${esc(T("builder.recPsu", { w: a.watts.recommended }))}</p>` : `<p class="muted">${esc(T("builder.powerEmpty"))}</p>`}
    ${psuW ? `<div class="meter tone-${loadTone}" role="img" aria-label="${esc(T("builder.psuLoad", { w: psuW, pct: load }))}"><i style="width:${Math.min(100, load)}%"></i></div><p class="meter-note">${esc(T("builder.psuLoad", { w: psuW, pct: load }))}</p>` : ""}
    ${a.watts.parts.length ? `<details class="watt-detail"><summary>${esc(T("builder.wattDetail"))}</summary><ul>${a.watts.parts.map((x) => `<li><span>${esc(shortName(x.name))}${x.qty > 1 ? ` ×${x.qty}` : ""}</span><b>${x.w} W</b></li>`).join("")}<li><span>${esc(T("builder.wattOther"))}</span><b>${a.watts.overhead} W</b></li></ul></details>` : ""}
  </section>
  <section class="scard"><h3>${icon("scale")}${esc(T("builder.balance"))} <sup class="beta">Beta</sup></h3>
    <label class="uc"><span>${esc(T("builder.useCase"))}</span><select id="usecase">${Object.entries(USE_CASES).map(([k, v]) => `<option value="${k}" ${k === useCase ? "selected" : ""}>${esc(loc(v.label))}</option>`).join("")}</select></label>
    <div class="gauge tone-${tone}"><div class="gauge-track"><i class="gauge-mid"></i><b class="gauge-dot" style="left:${pos}%"></b></div>
      <div class="gauge-labels"><span>${esc(T("builder.gauge.cpu"))}</span><span>${esc(T("builder.gauge.ok"))}</span><span>${esc(T("builder.gauge.gpu"))}</span></div></div>
    <p class="bal-text tone-${tone}">${esc(balanceText(b))}</p>
    ${b.notes?.includes("single-channel") ? `<p class="muted small">${esc(T("builder.bal.tipChannel"))}</p>` : ""}${b.notes?.includes("low-ram") ? `<p class="muted small">${esc(T("builder.bal.tipRam"))}</p>` : ""}
    ${cpuItem && gpuItem ? `<p class="muted small">${esc(T("builder.scores", { cpu: cpuScore(cpuItem.p), gpu: gpuScore(gpuItem.p) }))}</p>` : ""}
    <p class="muted small">${esc(T("builder.balanceNote"))}</p>
  </section>
  <section class="scard"><h3>${icon("check")}${esc(T("builder.compatTitle"))}</h3>
    <p class="compat-status tone-${statusTone}">${esc(status)}</p>
    ${a.missing.length ? `<p class="muted small">${esc(T("builder.stillNeeded", { list: a.missing.map((k) => loc(ROW[k].label)).join(", ") }))}</p>` : ""}
    ${compatList}
  </section>
  <section class="scard scard-free"><div class="ticket-stamp"><strong>৳0</strong><span>${esc(T("shop.serviceCharge"))}</span></div><p>${esc(loc(shop().store.freeServiceNote))} ${esc(loc(shop().store.preorderNote))} <a href="/terms#shop-terms">${esc(loc(shop().store.tcNote))}</a></p></section>`;
}

function topBarHTML() {
  const a = analysis();
  const n = itemCount();
  return `<div class="builder-top">
    <label class="check hide-empty"><input type="checkbox" id="hide-empty" ${hideEmpty ? "checked" : ""}><span>${esc(T("builder.hideEmpty"))}</span></label>
    <div class="bt-box bt-watt" title="${esc(T("builder.wattTip"))}"><b>${a.watts.total} W</b><small>${esc(T("builder.estWattage"))}</small><sup>BETA</sup></div>
    <div class="bt-box bt-total"><b>${money(totalPrice())}</b><small>${esc(T("builder.items", { n }))}</small></div>
    <div class="bt-actions">
      <button type="button" class="tbtn tbtn-cart" id="act-cart">${icon("cart")}<span>${esc(T("builder.addToCart"))}</span></button>
      <button type="button" class="tbtn" id="act-save">${icon("save")}<span>${esc(T("builder.savePc"))}</span></button>
      <button type="button" class="tbtn" id="act-print">${icon("print")}<span>${esc(T("builder.print"))}</span></button>
      <button type="button" class="tbtn" id="act-shot">${icon("camera")}<span>${esc(T("builder.screenshot"))}</span></button>
    </div>
  </div>`;
}

function printSheetHTML() {
  const items = flatten(sel, byId());
  const a = analysis();
  const store = shop().store;
  return `<div class="print-head"><h1>Ovi's Fix — PC build quote</h1><p>${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p></div>
  <table><thead><tr><th>Part</th><th>Product</th><th>Qty</th><th>Price</th></tr></thead><tbody>
  ${items.map((x) => `<tr><td>${esc(loc(ROW[x.row].label))}</td><td>${esc(x.p.name)}</td><td>${x.qty}</td><td>${money(unitPrice(x.p) * x.qty)}</td></tr>`).join("")}
  </tbody><tfoot><tr><td colspan="3">Total</td><td>${money(totalPrice())}</td></tr></tfoot></table>
  <p>Estimated wattage: ${a.watts.total} W${a.watts.recommended ? ` · Recommended PSU: ${a.watts.recommended} W+` : ""}</p>
  <p>${esc(loc(store.freeServiceNote))} ${esc(loc(store.preorderNote))} ${esc(loc(store.tcNote))}</p>
  <p>${esc(store.phone || "")} · ${esc(store.email || "")} · ${esc(loc(store.address))}</p>
  <p class="small">${esc(loc(store.priceNote))}</p>`;
}

function render() {
  const root = document.getElementById("page-root");
  if (!root.querySelector(".builder")) return;
  const a = analysis();
  document.getElementById("builder-top").innerHTML = topBarHTML();
  document.getElementById("builder-platform").innerHTML = platformHTML();
  const core = BUILDER_ROWS.filter((r) => r.group === "core");
  const peri = BUILDER_ROWS.filter((r) => r.group === "peripherals");
  const coreHTML = core.map((r) => rowHTML(r, a)).join("");
  const periHTML = peri.map((r) => rowHTML(r, a)).join("");
  document.getElementById("builder-rows").innerHTML = `
    <h2 class="group-title">${esc(T("builder.groupCore"))}</h2>${coreHTML}
    ${periHTML.trim() ? `<h2 class="group-title">${esc(T("builder.groupPeripherals"))}</h2>${periHTML}` : ""}`;
  document.getElementById("builder-side").innerHTML = sideHTML(a);
  document.getElementById("print-sheet").innerHTML = printSheetHTML();
}

/* ------------------------------------------------------------------ chooser */
const STRICT_ROWS = new Set([...BOARD_FILTERED_ROWS, "mobo"]);

function openChooser(rowKey, replaceIndex = null) {
  const row = ROW[rowKey];
  // Motherboard first: dependent lists stay closed until a board is chosen.
  if (row.needsBoard && !board()) { toast(T("builder.boardFirst"), { kind: "warn" }); openChooser("mobo", sel.mobo?.length ? 0 : null); return; }
  const base = emptySelection();
  for (const k of Object.keys(sel)) base[k] = sel[k].filter((_, i) => !(k === rowKey && i === replaceIndex));
  const brd = base.mobo?.[0] ? byId().get(base.mobo[0].id) : null;
  const strict = STRICT_ROWS.has(rowKey);
  const modal = openModal({ title: T("builder.chooseRow", { part: loc(row.label) }), wide: true, className: "chooser" });

  const facts = brd && BOARD_FILTERED_ROWS.includes(rowKey) ? boardFit(rowKey, brd) : [];
  const banner = facts.length
    ? `<div class="fit-banner">${icon("check")}<div><strong>${esc(T("builder.fitOnly"))}</strong><span class="fit-board">${esc(shortName(brd.name))}</span>
        <span class="fit-chips">${facts.map((f) => `<b>${esc(f.k)}: ${esc(tv(f.v))}</b>`).join("")}</span></div></div>`
    : rowKey === "mobo" && flatten(base, byId()).some((x) => x.row !== "mobo" && BOARD_FILTERED_ROWS.includes(x.row))
      ? `<div class="fit-banner is-note">${icon("info")}<div><span>${esc(T("builder.boardSwapNote"))}</span></div></div>` : "";
  modal.body.innerHTML = `${banner}<div id="chooser-root"></div>`;

  const compat = (p) => {
    const r = productCompat(rowKey, p, base, byId());
    return r.ok ? { ok: true, warn: r.warn ? loc(r.warn) : "" } : { ok: false, reason: loc(r.reason) };
  };
  const emptyHTML = () => {
    const label = loc(row.label);
    const need = facts.map((f) => `${f.k} ${f.v}`).join(", ");
    const text = `Hi Ovi's Fix, I'm building a PC${brd ? ` with the ${brd.name}` : ""}. Do you have a ${label}${need ? ` that fits (${need})` : ""}?`;
    return `<div class="empty"><div class="empty-ic">${icon("search")}</div><h3>${esc(T("builder.noFit", { part: label }))}</h3><p>${esc(T("builder.noFitHint"))}</p><a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="${esc(waLink(text))}">${icon("whatsapp")}<span>${esc(T("shop.askExpert"))}</span></a></div>`;
  };
  mountListing(modal.body.querySelector("#chooser-root"), {
    subs: row.subs, urlSync: false, pageSize: 10, forceView: "list", listView: "rows", newTab: true, compat, compatMode: strict ? "hide" : "toggle", emptyHTML,
    action: (p, c) => {
      const out = p.stock === "out" || p.stock === "soon";
      const label = out ? T(p.stock === "out" ? "shop.outOfStock" : "shop.upcoming") : c.ok ? T("builder.select") : T("builder.addAnyway");
      return { html: `<button type="button" class="btn ${c.ok ? "btn-primary" : "btn-secondary"} btn-sm" data-pick="${esc(p.id)}" ${out ? "disabled" : ""}>${esc(label)}</button>` };
    },
    onPick: (id) => {
      if (rowKey === "mobo") chooseBoard(id); else { addItem(rowKey, id, replaceIndex); toast(T("builder.added")); }
      modal.close();
    },
  });
}

/* --------------------------------------------------------------- dialogs/actions */
function openSaveDialog() {
  const modal = openModal({ title: T("builder.savedTitle") });
  const paint = () => {
    const saved = readSaved();
    modal.body.innerHTML = `
      <form class="save-form" id="save-form"><input name="name" maxlength="40" placeholder="${esc(T("builder.saveName"))}" aria-label="${esc(T("builder.saveName"))}"><button class="btn btn-primary btn-sm" type="submit" ${itemCount() ? "" : "disabled"}>${icon("save")}<span>${esc(T("builder.saveCurrent"))}</span></button></form>
      <div class="share-row"><button type="button" class="btn btn-secondary btn-sm" id="copy-link" ${itemCount() ? "" : "disabled"}>${icon("link")}<span>${esc(T("builder.copyLink"))}</span></button></div>
      ${saved.length ? `<ul class="saved-list">${saved.map((s, i) => { const sl = sanitizeSelection(s.sel, byId()); const t = flatten(sl, byId()).reduce((n, x) => n + unitPrice(x.p) * x.qty, 0); return `<li data-i="${i}"><div><strong>${esc(s.name)}</strong><small>${new Date(s.ts).toLocaleDateString("en-GB")} · ${money(t)}</small></div><button type="button" class="btn btn-secondary btn-sm" data-load>${esc(T("builder.load"))}</button><button type="button" class="icon-btn" data-del aria-label="${esc(T("cart.remove"))}">${icon("trash")}</button></li>`; }).join("")}</ul>` : `<p class="muted">${esc(T("builder.noSaved"))}</p>`}`;
  };
  paint();
  modal.body.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get("name")?.toString().trim() || T("builder.untitled", { n: readSaved().length + 1 });
    writeSaved([{ name, ts: Date.now(), sel }, ...readSaved()]);
    toast(T("builder.saved"));
    paint();
  });
  modal.body.addEventListener("click", async (e) => {
    const li = e.target.closest("li[data-i]");
    if (li && e.target.closest("[data-load]")) { sel = sanitizeSelection(readSaved()[li.dataset.i].sel, byId()); persist(); render(); modal.close(); toast(T("builder.loaded")); }
    if (li && e.target.closest("[data-del]")) { const a = readSaved(); a.splice(Number(li.dataset.i), 1); writeSaved(a); paint(); }
    if (e.target.closest("#copy-link")) {
      const url = `${location.origin}/pc-builder?b=${encodeSelection(sel)}`;
      try { await navigator.clipboard.writeText(url); toast(T("builder.linkCopied")); } catch (err) { window.prompt(T("builder.copyLink"), url); }
    }
  });
}

function addAllToCart() {
  const items = flatten(sel, byId());
  const miss = missingRequired(sel);
  if (!items.length) { toast(T("builder.emptyBuild"), { kind: "warn" }); return; }
  if (miss.length) { toast(T("builder.needRequired", { list: miss.map((k) => loc(ROW[k].label)).join(", ") }), { kind: "warn", ms: 4500 }); return; }
  const errors = checkBuild(sel, byId()).filter((i) => i.level === "error");
  if (errors.length && !confirm(T("builder.confirmErrors", { n: errors.length }))) return;
  const blocked = items.filter((x) => x.p.stock === "out" || x.p.stock === "soon");
  if (blocked.length) { toast(T("builder.someUnavailable", { name: blocked[0].p.name }), { kind: "warn", ms: 4500 }); return; }
  cart.addMany(items.map((x) => ({ id: x.p.id, qty: x.qty })));
  cart.setMeta({ fromBuilder: true });
  location.href = "/cart";
}

/** Draws the build as a clean quote image and downloads it (no screenshot library needed). */
async function saveAsImage() {
  const items = flatten(sel, byId());
  if (!items.length) { toast(T("builder.emptyBuild"), { kind: "warn" }); return; }
  try { await document.fonts.load("700 30px Montserrat"); await document.fonts.load("600 18px Montserrat"); } catch (e) { /* use fallback fonts */ }
  const a = analysis();
  const store = shop().store;
  const W = 1080, pad = 48, rowH = 62, dpr = 2;
  const H = 150 + 70 + items.length * rowH + 250;
  const c = document.createElement("canvas");
  c.width = W * dpr; c.height = H * dpr;
  const g = c.getContext("2d");
  g.scale(dpr, dpr);
  const sans = "Montserrat, 'Segoe UI', Arial, sans-serif", mono = "'IBM Plex Mono', Consolas, monospace";
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#0b1b33"; g.fillRect(0, 0, W, 130);
  g.font = `700 36px ${sans}`; g.fillStyle = "#ffffff"; g.fillText("Ovi's ", pad, 66);
  const w1 = g.measureText("Ovi's ").width; g.fillStyle = "#ff5a52"; g.fillText("Fix", pad + w1, 66);
  g.font = `500 17px ${sans}`; g.fillStyle = "#b9c4d8";
  g.fillText(`PC build quote · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, pad, 100);
  g.textAlign = "right"; g.fillStyle = "#ffffff"; g.font = `700 22px ${sans}`; g.fillText("Service charge ৳0", W - pad, 62);
  g.font = `500 15px ${sans}`; g.fillStyle = "#b9c4d8"; g.fillText("for PCs built from our website · T&C apply", W - pad, 90);
  g.textAlign = "left";
  let y = 130 + 44;
  g.font = `700 14px ${sans}`; g.fillStyle = "#5d6b85";
  g.fillText("PART", pad, y); g.fillText("PRODUCT", pad + 190, y); g.textAlign = "right"; g.fillText("PRICE", W - pad, y); g.textAlign = "left";
  y += 14;
  const fit = (text, max) => { let t = text; while (g.measureText(t).width > max && t.length > 4) t = t.slice(0, -2); return t === text ? t : t.trimEnd() + "…"; };
  for (const x of items) {
    g.strokeStyle = "#e3e8f0"; g.beginPath(); g.moveTo(pad, y); g.lineTo(W - pad, y); g.stroke();
    g.font = `600 17px ${sans}`; g.fillStyle = "#0b1b33"; g.fillText(loc({ en: ROW[x.row].label.en, bn: ROW[x.row].label.en }), pad, y + 38);
    g.font = `500 17px ${sans}`; g.fillStyle = "#1c2a44"; g.fillText(fit(x.p.name + (x.qty > 1 ? `  ×${x.qty}` : ""), W - pad * 2 - 190 - 170), pad + 190, y + 38);
    g.textAlign = "right"; g.font = `600 18px ${mono}`; g.fillStyle = "#0b1b33"; g.fillText(money(unitPrice(x.p) * x.qty), W - pad, y + 38); g.textAlign = "left";
    y += rowH;
  }
  g.strokeStyle = "#0b1b33"; g.lineWidth = 2; g.beginPath(); g.moveTo(pad, y); g.lineTo(W - pad, y); g.stroke(); g.lineWidth = 1;
  y += 52;
  g.font = `700 22px ${sans}`; g.fillStyle = "#0b1b33"; g.fillText("Total", pad, y);
  g.textAlign = "right"; g.font = `700 30px ${mono}`; g.fillText(money(totalPrice()), W - pad, y); g.textAlign = "left";
  y += 44;
  g.font = `500 17px ${sans}`; g.fillStyle = "#1c2a44";
  g.fillText(`Estimated wattage: ${a.watts.total} W${a.watts.recommended ? `   ·   Recommended PSU: ${a.watts.recommended} W or more` : ""}`, pad, y);
  y += 30;
  const errs = a.issues.filter((i) => i.level === "error").length;
  g.fillStyle = errs ? "#c0322e" : "#1f8f5f";
  g.fillText(errs ? `${errs} compatibility issue${errs > 1 ? "s" : ""} to fix` : "No compatibility errors found", pad, y);
  y += 44;
  g.font = `500 15px ${sans}`; g.fillStyle = "#5d6b85";
  g.fillText(fit(`${store.phone || ""}   ·   ${store.email || ""}   ·   ${store.address?.en || ""}`, W - pad * 2), pad, y);
  y += 24;
  g.fillText(fit("Estimates only. Prices in BDT may change; we confirm price and availability before your order is final.", W - pad * 2), pad, y);
  c.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "ovis-fix-pc-build.png";
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(T("builder.imageSaved"));
  }, "image/png");
}

/* --------------------------------------------------------------------- boot */
function shell() {
  document.getElementById("page-root").innerHTML = `
    <div id="page-head"></div>
    <section class="section-tight"><div class="container builder">
      <div id="builder-top"></div>
      <div id="builder-platform"></div>
      <div class="builder-grid">
        <div id="builder-rows" class="builder-rows"></div>
        <aside id="builder-side" class="builder-side" aria-label="${esc(T("builder.summary"))}"></aside>
      </div>
    </div></section>
    <div id="print-sheet" class="print-only"></div>`;
  document.getElementById("page-head").innerHTML = pageHeader({ crumbs: [{ label: T("nav.builder") }], title: T("builder.title"), lead: T("builder.lead"), badge: "Beta" });
}

boot("builder", async () => {
  setPageMeta(T("builder.title"), T("builder.lead"));
  shell();
  loadInitial();
  render();
  const root = document.getElementById("page-root");

  root.addEventListener("click", (e) => {
    const rowEl = e.target.closest("[data-rowkey]");
    if (e.target.closest("[data-choose-board]")) { openChooser("mobo", sel.mobo?.length ? 0 : null); return; }
    if (e.target.closest("[data-choose]") && rowEl) { openChooser(rowEl.dataset.rowkey); return; }
    const item = e.target.closest(".bitem");
    if (item) {
      const rk = item.dataset.row, idx = Number(item.dataset.idx);
      if (e.target.closest("[data-change]")) { openChooser(rk, idx); return; }
      if (e.target.closest("[data-remove]")) { removeItem(rk, idx); return; }
      const qd = e.target.closest("[data-qd]");
      if (qd) { setQty(rk, idx, sel[rk][idx].qty + Number(qd.dataset.qd)); return; }
    }
    if (e.target.closest("#act-cart")) addAllToCart();
    else if (e.target.closest("#act-save")) openSaveDialog();
    else if (e.target.closest("#act-print")) window.print();
    else if (e.target.closest("#act-shot")) saveAsImage();
  });
  root.addEventListener("change", (e) => {
    if (e.target.id === "hide-empty") { hideEmpty = e.target.checked; render(); }
    if (e.target.id === "usecase") { useCase = e.target.value; render(); }
  });
  document.addEventListener("ovisfix:languagechange", () => { setPageMeta(T("builder.title"), T("builder.lead")); shell(); render(); });
});
