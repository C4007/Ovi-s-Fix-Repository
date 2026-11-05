/* Ovi's Fix — admin: Pre-built PCs panel and Offers panel */
import { SUBS, CATEGORIES, BUILDER_ROWS } from "../catalog-schema.js";
import { esc, money, slugify, openModal, toast, priceInfo, offerActive, offerAppliesTo, buildMediaHTML, subLabel } from "../shop-core.js";
import { icon } from "../icons.js";
import { emptySelection, selectionFromParts, flatten, pruneForBoard, productCompat, checkBuild, estimateWatts, analyzeBalance, ROW } from "../builder-logic.js";
import { $, state, markDirty, onChange, uploadImage, resizeImage, field, input, textarea } from "./core.js";

const byId = () => new Map(state.products.map((p) => [p.id, p]));
const unit = (p) => priceInfo(p, state.offers).price;
const uniqueId = (base, list) => { let id = slugify(base), n = 2; const root = id; while (list.some((x) => x.id === id)) id = `${root}-${n++}`; return id; };
const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };

/* ===================================================================== builds */
function buildSummary(b) {
  const map = byId();
  const sel = selectionFromParts(b.parts, map);
  const parts = flatten(sel, map);
  const sum = parts.reduce((s, x) => s + unit(x.p) * x.qty, 0);
  const missing = b.parts.filter((x) => !map.has(x.id)).length;
  return { sel, parts, sum, missing, watts: estimateWatts(sel, map), issues: checkBuild(sel, map).filter((i) => i.level === "error") };
}

export function renderBuilds() {
  const root = $("builds-root");
  if (!root) return;
  root.innerHTML = state.builds.length ? `<div class="a-cards">${state.builds.map((b, i) => {
    const s = buildSummary(b);
    const price = b.priceOverride ?? s.sum;
    return `<article class="a-card" data-i="${i}">
      <div class="a-card-media">${buildMediaHTML(b, i)}</div>
      <div class="a-card-body">
        <div class="a-card-top"><h3>${esc(b.name.en)}</h3><span class="pill ${b.active !== false ? "pill-on" : "pill-off"}">${b.active !== false ? "Shown" : "Hidden"}</span></div>
        <p class="admin-id-hint">${esc(b.tagline?.en || "")}</p>
        <div class="a-card-stats"><b>${money(price)}</b><span>${b.parts.length} parts</span><span>~${s.watts.total} W</span>
          ${s.issues.length ? `<span class="bad">${s.issues.length} compatibility problem${s.issues.length > 1 ? "s" : ""}</span>` : ""}${s.missing ? `<span class="bad">${s.missing} missing product${s.missing > 1 ? "s" : ""}</span>` : ""}</div>
        <div class="a-card-act"><button type="button" class="btn btn-secondary btn-sm" data-edit>Edit</button><button type="button" class="btn btn-ghost btn-sm" data-dup>Duplicate</button>
          <button type="button" class="icon-btn" data-up aria-label="Move up" ${i === 0 ? "disabled" : ""}>↑</button><button type="button" class="icon-btn" data-down aria-label="Move down" ${i === state.builds.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="icon-btn" data-del aria-label="Delete">${icon("trash")}</button></div>
      </div></article>`;
  }).join("")}</div>` : `<div class="admin-empty-state glass">No pre-built PCs yet — click “Add pre-built PC”.</div>`;
}

function buildEditor(existing) {
  const isNew = !existing;
  const b = existing ? JSON.parse(JSON.stringify(existing)) : { id: "", name: { en: "", bn: "" }, tagline: { en: "", bn: "" }, useCase: "gaming", badge: "", image: "", priceOverride: null, active: true, parts: [], highlights: [{ en: "", bn: "" }, { en: "", bn: "" }, { en: "", bn: "" }] };
  while (b.highlights.length < 3) b.highlights.push({ en: "", bn: "" });
  let sel = selectionFromParts(b.parts, byId());
  const pending = { dataUrl: "", remove: false };
  const modal = openModal({ title: isNew ? "Add pre-built PC" : "Edit pre-built PC", wide: true, className: "admin-modal" });

  modal.body.innerHTML = `<form id="b-form" novalidate>
    <div class="admin-form-grid">
      ${field("Name — English *", input("name_en", b.name.en, "required"))}
      ${field("Name — Bangla *", input("name_bn", b.name.bn, "required"))}
      ${field("Short line — English", input("tag_en", b.tagline?.en || ""), "", "")}
      ${field("Short line — Bangla", input("tag_bn", b.tagline?.bn || ""))}
      ${field("Badge (optional)", input("badge", b.badge || "", 'placeholder="e.g. Most popular"'))}
      ${field("Best for", `<select class="form-input" name="useCase">${[["office", "Study & office"], ["gaming", "Gaming"], ["creator", "Creator / editing"]].map(([v, l]) => `<option value="${v}" ${b.useCase === v ? "selected" : ""}>${l}</option>`).join("")}</select>`)}
      ${field("Fixed price (৳) — optional", input("priceOverride", b.priceOverride ?? "", 'type="number" min="0" placeholder="empty = add up the parts automatically"'), "Leave empty and the price follows each part's current price.")}
      <div class="form-group"><label class="form-label">Visibility</label><label class="check"><input type="checkbox" name="active" ${b.active !== false ? "checked" : ""}><span>Show on the website</span></label></div>
    </div>
    <h3 class="a-sub">Photo</h3>
    <div class="a-photo"><div class="a-photo-prev" id="b-prev">${buildMediaHTML(b, 0)}</div>
      <div class="a-photo-ctl"><label class="btn btn-secondary btn-sm">${icon("upload")}<span>Upload photo</span><input type="file" id="b-file" accept="image/*" hidden></label>
        <button type="button" class="btn btn-ghost btn-sm" id="b-rmimg">Remove photo</button>
        <p class="admin-id-hint">No photo? A clean PC illustration is shown instead.</p>${input("image", /^data:/.test(b.image) ? "" : b.image, 'placeholder="Photo link (optional)"')}</div></div>
    <h3 class="a-sub">Highlights (up to 3 short points)</h3>
    <div class="admin-form-grid">${b.highlights.slice(0, 3).map((h, i) => `${field(`Point ${i + 1} — English`, input(`hl_en_${i}`, h.en))}${field(`Point ${i + 1} — Bangla`, input(`hl_bn_${i}`, h.bn))}`).join("")}</div>
    <h3 class="a-sub">Parts</h3>
    <p class="admin-id-hint">Start with the motherboard — the lists for CPU, RAM, cooler and casing then show only parts that fit it, just like the PC Builder.</p>
    <div id="b-parts"></div>
    <div id="b-summary" class="a-summary"></div>
    <p class="form-msg is-error" id="b-err" role="alert"></p>
    <div class="a-modal-foot"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="submit" class="btn btn-primary">${isNew ? "Add pre-built PC" : "Save pre-built PC"}</button></div>
  </form>`;

  const drawParts = () => {
    const map = byId();
    const board = sel.mobo[0] ? map.get(sel.mobo[0].id) : null;
    const rowHTML = (row) => {
      const slots = Array.from({ length: row.max }, (_, i) => i);
      return slots.map((i) => {
        const cur = sel[row.key][i];
        const base = emptySelection();
        for (const k of Object.keys(sel)) base[k] = sel[k].filter((_, idx) => !(k === row.key && idx === i));
        const locked = row.needsBoard && !board;
        const opts = state.products.filter((p) => row.subs.includes(p.sub)).filter((p) => (cur && cur.id === p.id) || locked ? true : productCompat(row.key, p, base, map).ok)
          .sort((a, c) => a.name.localeCompare(c.name));
        if (i > 0 && !sel[row.key][i - 1]) return "";
        return `<div class="a-part"><label>${esc(row.label.en)}${row.max > 1 ? ` #${i + 1}` : ""}${row.required ? ' <i class="req-star">*</i>' : ""}</label>
          <select class="form-input" data-row="${row.key}" data-i="${i}" ${locked ? "disabled" : ""}><option value="">${locked ? "Choose the motherboard first" : "— none —"}</option>
          ${opts.map((p) => `<option value="${esc(p.id)}" ${cur?.id === p.id ? "selected" : ""}>${esc(p.name)} — ${money(unit(p))}${p.stock === "out" ? " (out of stock)" : ""}</option>`).join("")}</select>
          ${row.qty > 1 && cur ? `<input type="number" class="form-input a-qty" min="1" max="${row.qty}" data-qty="${row.key}" data-i="${i}" value="${cur.qty}" aria-label="Quantity">` : "<span></span>"}</div>`;
      }).join("");
    };
    $("b-parts").innerHTML = `<div class="a-parts">${BUILDER_ROWS.filter((r) => r.group === "core").map(rowHTML).join("")}</div>
      <details class="a-peri" ${BUILDER_ROWS.filter((r) => r.group !== "core").some((r) => sel[r.key].length) ? "open" : ""}><summary>Peripherals & others (optional)</summary><div class="a-parts">${BUILDER_ROWS.filter((r) => r.group !== "core").map(rowHTML).join("")}</div></details>`;
    drawSummary();
  };
  const drawSummary = () => {
    const map = byId();
    const parts = flatten(sel, map);
    const sum = parts.reduce((s, x) => s + unit(x.p) * x.qty, 0);
    const w = estimateWatts(sel, map);
    const issues = checkBuild(sel, map);
    const bal = analyzeBalance(sel, map, "gaming-1080");
    $("b-summary").innerHTML = `<div class="a-sum-nums"><div><small>Parts total</small><b>${money(sum)}</b></div><div><small>Estimated wattage</small><b>${w.total} W</b></div><div><small>Recommended PSU</small><b>${w.recommended ? w.recommended + " W+" : "—"}</b></div><div><small>CPU / GPU balance</small><b>${bal.state === "none" ? "—" : bal.state === "igpu" ? "built-in graphics" : bal.state === "balanced" ? "balanced" : bal.state}</b></div></div>
      ${issues.length ? `<ul class="issues">${issues.map((i) => `<li class="lv-${i.level}">${icon(i.level === "info" ? "info" : "alert")}<span>${esc(i.text.en)}</span></li>`).join("")}</ul>` : parts.length ? `<p class="tone-good">${icon("check")} No compatibility problems found.</p>` : ""}`;
  };
  drawParts();

  modal.body.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.dataset.row) {
      const row = ROW[t.dataset.row], i = Number(t.dataset.i);
      if (!t.value) { sel[row.key].splice(i, 1); }
      else if (sel[row.key][i]) sel[row.key][i] = { id: t.value, qty: Math.min(sel[row.key][i].qty, row.qty) };
      else sel[row.key][i] = { id: t.value, qty: 1 };
      if (row.key === "mobo" && sel.mobo[0]) {
        const r = pruneForBoard(sel, byId().get(sel.mobo[0].id), byId());
        sel = r.sel;
        if (r.removed.length) toast(`Removed parts that don't fit this motherboard: ${r.removed.map((x) => x.p.name).join(", ")}`, { kind: "warn", ms: 6000 });
      }
      drawParts();
    } else if (t.dataset.qty) {
      const row = ROW[t.dataset.qty];
      sel[row.key][Number(t.dataset.i)].qty = Math.min(row.qty, Math.max(1, Math.floor(Number(t.value)) || 1));
      drawSummary();
    } else if (t.id === "b-file" && t.files[0]) {
      try { pending.dataUrl = await resizeImage(t.files[0]); pending.remove = false; $("b-prev").innerHTML = `<img src="${pending.dataUrl}" alt="">`; } catch (err) { $("b-err").textContent = err.message; }
    }
  });
  modal.body.addEventListener("click", (e) => {
    if (e.target.closest("#b-rmimg")) { pending.dataUrl = ""; pending.remove = true; b.image = ""; $("b-prev").innerHTML = buildMediaHTML({ ...b, image: "" }, 0); modal.body.querySelector('[name="image"]').value = ""; }
  });
  modal.body.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const err = $("b-err");
    const out = { ...b };
    out.name = { en: String(f.get("name_en") || "").trim(), bn: String(f.get("name_bn") || "").trim() };
    out.tagline = { en: String(f.get("tag_en") || "").trim(), bn: String(f.get("tag_bn") || "").trim() };
    out.badge = String(f.get("badge") || "").trim();
    out.useCase = String(f.get("useCase"));
    out.active = f.get("active") === "on";
    const po = String(f.get("priceOverride") || "").trim();
    out.priceOverride = po === "" ? null : Number(po);
    out.highlights = [0, 1, 2].map((i) => ({ en: String(f.get(`hl_en_${i}`) || "").trim(), bn: String(f.get(`hl_bn_${i}`) || "").trim() })).filter((h) => h.en || h.bn).map((h) => ({ en: h.en || h.bn, bn: h.bn || h.en }));
    out.parts = flatten(sel, byId()).map((x) => ({ id: x.p.id, qty: x.qty }));
    out.image = String(f.get("image") || "").trim() || (pending.remove ? "" : /^data:/.test(b.image) ? "" : b.image);
    const problems = [];
    if (!out.name.en || !out.name.bn) problems.push("Enter the name in English and Bangla.");
    if (!out.parts.length) problems.push("Add at least one part.");
    if (out.priceOverride !== null && (!Number.isFinite(out.priceOverride) || out.priceOverride < 0)) problems.push("Fixed price must be a number.");
    if (!out.tagline.en) out.tagline.en = out.tagline.bn; if (!out.tagline.bn) out.tagline.bn = out.tagline.en;
    if (problems.length) { err.textContent = problems.join(" "); return; }
    if (isNew) out.id = uniqueId(out.name.en, state.builds);
    if (pending.dataUrl) {
      const r = await uploadImage(`build-${out.id}`.slice(0, 80), pending.dataUrl);
      if (!r.ok) { err.textContent = r.error; return; }
      out.image = r.url;
    }
    const i = state.builds.findIndex((x) => x.id === out.id);
    if (i === -1) state.builds.push(out); else state.builds[i] = out;
    markDirty("builds"); renderBuilds(); modal.close();
    toast("Saved — click “Publish changes” to update the site.");
  });
}

export function initBuilds() {
  const panel = $("admin-panel-builds");
  if (!panel) return;
  panel.innerHTML = `<div class="admin-dashboard-head"><div><h2 class="admin-dashboard-title">Pre-built PCs</h2><p class="admin-dashboard-sub">Ready-made PCs with photos. The price adds up the parts automatically, so it always follows your product prices.</p></div>
    <div class="admin-dashboard-actions"><button type="button" class="btn btn-primary btn-sm" id="b-add">${icon("plus")}<span>Add pre-built PC</span></button></div></div><div id="builds-root"></div>`;
  panel.addEventListener("click", (e) => {
    const card = e.target.closest(".a-card");
    const i = card ? Number(card.dataset.i) : -1;
    if (e.target.closest("#b-add")) buildEditor(null);
    else if (card && e.target.closest("[data-edit]")) buildEditor(state.builds[i]);
    else if (card && e.target.closest("[data-dup]")) { const c = JSON.parse(JSON.stringify(state.builds[i])); c.id = uniqueId(`${c.name.en} copy`, state.builds); c.name.en += " (copy)"; c.name.bn += " (কপি)"; c.image = ""; state.builds.splice(i + 1, 0, c); markDirty("builds"); renderBuilds(); }
    else if (card && e.target.closest("[data-up]")) { move(state.builds, i, -1); markDirty("builds"); renderBuilds(); }
    else if (card && e.target.closest("[data-down]")) { move(state.builds, i, 1); markDirty("builds"); renderBuilds(); }
    else if (card && e.target.closest("[data-del]")) { if (confirm(`Delete “${state.builds[i].name.en}”?`)) { state.builds.splice(i, 1); markDirty("builds"); renderBuilds(); } }
  });
  onChange(renderBuilds);
  renderBuilds();
}

/* ===================================================================== offers */
function offerStatus(o) {
  if (o.active === false) return ["Off", "pill-off"];
  if (offerActive(o)) return ["Live now", "pill-on"];
  const s = o.startsAt && new Date(o.startsAt).getTime() > Date.now();
  return s ? ["Scheduled", "pill-soon"] : ["Expired", "pill-off"];
}
const targetCount = (o) => (o.kind === "discount" ? state.products.filter((p) => offerAppliesTo(o, p)).length : 0);
function targetText(o) {
  if (o.kind !== "discount") return "Banner only (no price change)";
  const t = o.target || {};
  if (t.all) return "All products";
  const bits = [(t.categories || []).map((c) => CATEGORIES[c]?.label.en).filter(Boolean).join(", "), (t.subs || []).map((s) => SUBS[s]?.label.en).filter(Boolean).join(", "), (t.brands || []).join(", "), (t.productIds || []).length ? `${t.productIds.length} product(s)` : ""].filter(Boolean);
  return bits.join(" · ") || "Nothing selected";
}

export function renderOffers() {
  const root = $("offers-root");
  if (!root) return;
  root.innerHTML = state.offers.length ? `<div class="a-cards a-cards-offers">${state.offers.map((o, i) => {
    const [st, cls] = offerStatus(o);
    const what = o.kind === "discount" ? (o.type === "percent" ? `${o.value}% off` : `${money(o.value)} off`) : "Perk";
    return `<article class="a-card" data-i="${i}"><div class="a-card-body">
      <div class="a-card-top"><h3>${esc(o.title.en)}</h3><span class="pill ${cls}">${st}</span></div>
      <div class="a-card-stats"><b>${what}</b><span>${esc(targetText(o))}</span>${o.kind === "discount" ? `<span>${targetCount(o)} products</span>` : ""}</div>
      <p class="admin-id-hint">${o.startsAt || "No start"} → ${o.endsAt || "No end date"}</p>
      <div class="a-card-act"><button type="button" class="btn btn-secondary btn-sm" data-edit>Edit</button><button type="button" class="btn btn-ghost btn-sm" data-dup>Duplicate</button><button type="button" class="icon-btn" data-del aria-label="Delete">${icon("trash")}</button></div></div></article>`;
  }).join("")}</div>` : `<div class="admin-empty-state glass">No offers yet — click “Add offer”.</div>`;
}

function offerEditor(existing) {
  const isNew = !existing;
  const o = existing ? JSON.parse(JSON.stringify(existing)) : { id: "", kind: "discount", type: "percent", value: 5, active: true, badge: "", title: { en: "", bn: "" }, subtitle: { en: "", bn: "" }, target: { all: false, categories: [], subs: [], brands: [], productIds: [] }, startsAt: null, endsAt: null, link: "" };
  o.target = { all: !!o.target?.all, categories: [...(o.target?.categories || [])], subs: [...(o.target?.subs || [])], brands: [...(o.target?.brands || [])], productIds: [...(o.target?.productIds || [])] };
  const modal = openModal({ title: isNew ? "Add offer" : "Edit offer", wide: true, className: "admin-modal" });
  const brands = [...new Set(state.products.map((p) => p.brand).filter(Boolean))].sort();

  const draw = () => {
    modal.body.innerHTML = `<form id="o-form" novalidate>
      <div class="admin-form-grid">
        ${field("Title — English *", input("title_en", o.title.en, "required"))}${field("Title — Bangla *", input("title_bn", o.title.bn, "required"))}
        ${field("Details — English", textarea("sub_en", o.subtitle?.en || ""))}${field("Details — Bangla", textarea("sub_bn", o.subtitle?.bn || ""))}
        ${field("Offer type", `<select class="form-input" name="kind"><option value="discount" ${o.kind === "discount" ? "selected" : ""}>Discount — lowers prices automatically</option><option value="perk" ${o.kind === "perk" ? "selected" : ""}>Perk / banner only — no price change</option></select>`)}
        ${field("Badge text (optional)", input("badge", o.badge || "", 'placeholder="e.g. 5% off"'))}
        ${o.kind === "discount" ? `${field("Discount is a", `<select class="form-input" name="type"><option value="percent" ${o.type === "percent" ? "selected" : ""}>Percentage (%)</option><option value="amount" ${o.type === "amount" ? "selected" : ""}>Fixed amount (৳)</option></select>`)}${field("Discount value", input("value", o.value, 'type="number" min="0" step="any"'))}` : field("Link when clicked", input("link", o.link || "", 'placeholder="/pc-builder"'))}
        ${field("Starts on", input("startsAt", o.startsAt || "", 'type="date"'), "Leave empty to start now.")}${field("Ends on", input("endsAt", o.endsAt || "", 'type="date"'), "The offer switches off by itself after this day.")}
        <div class="form-group"><label class="form-label">Status</label><label class="check"><input type="checkbox" name="active" ${o.active !== false ? "checked" : ""}><span>Offer is on</span></label></div>
      </div>
      ${o.kind === "discount" ? `<h3 class="a-sub">Which products get the discount?</h3>
        <label class="check"><input type="radio" name="scope" value="all" ${o.target.all ? "checked" : ""}><span>Every product in the shop</span></label>
        <label class="check"><input type="radio" name="scope" value="some" ${o.target.all ? "" : "checked"}><span>Only the ones I choose below</span></label>
        <div class="a-scope" ${o.target.all ? "hidden" : ""}>
          <p class="admin-id-hint">A product gets the discount if it matches ANY of these.</p>
          <div class="a-checks">${Object.entries(CATEGORIES).map(([k, c]) => `<label class="check"><input type="checkbox" data-cat value="${k}" ${o.target.categories.includes(k) ? "checked" : ""}><span>${esc(c.label.en)} (all)</span></label>`).join("")}</div>
          <details class="a-peri"><summary>Pick specific sub-categories</summary><div class="a-checks">${Object.entries(SUBS).map(([k, s]) => `<label class="check"><input type="checkbox" data-sub value="${k}" ${o.target.subs.includes(k) ? "checked" : ""}><span>${esc(s.label.en)}</span></label>`).join("")}</div></details>
          ${field("Brands (comma separated)", `${input("brands", o.target.brands.join(", "), 'list="dl-brands" placeholder="e.g. Lexar, Kingston"')}<datalist id="dl-brands">${brands.map((b) => `<option value="${esc(b)}">`).join("")}</datalist>`)}
          <div class="form-group"><label class="form-label">Specific products</label>
            <input class="form-input" id="o-find" placeholder="Type to search products to add…" autocomplete="off"><div id="o-found" class="a-found"></div>
            <div id="o-picked" class="chips">${o.target.productIds.map((id) => { const p = state.products.find((x) => x.id === id); return `<span class="chip chip-x" data-rm="${esc(id)}">${esc(p ? p.name.slice(0, 40) : id)}${icon("close")}</span>`; }).join("")}</div></div>
        </div>
        <p class="a-summary" id="o-count"></p>` : ""}
      <p class="form-msg is-error" id="o-err" role="alert"></p>
      <div class="a-modal-foot"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="submit" class="btn btn-primary">${isNew ? "Add offer" : "Save offer"}</button></div>
    </form>`;
    updateCount();
  };
  const readTarget = () => {
    const f = modal.body.querySelector("#o-form");
    if (!f || o.kind !== "discount") return;
    o.target.all = f.elements.scope?.value === "all";
    o.target.categories = [...f.querySelectorAll("[data-cat]:checked")].map((x) => x.value);
    o.target.subs = [...f.querySelectorAll("[data-sub]:checked")].map((x) => x.value);
    o.target.brands = String(f.elements.brands?.value || "").split(",").map((x) => x.trim()).filter(Boolean);
  };
  const updateCount = () => {
    const el = modal.body.querySelector("#o-count");
    if (!el) return;
    const n = state.products.filter((p) => offerAppliesTo({ ...o, kind: "discount" }, p)).length;
    el.innerHTML = `${icon("percent")} This offer currently applies to <b>${n}</b> product${n === 1 ? "" : "s"}.`;
  };
  draw();

  modal.body.addEventListener("change", (e) => {
    if (e.target.name === "kind") {
      const f = new FormData(modal.body.querySelector("#o-form"));
      o.title = { en: f.get("title_en") || "", bn: f.get("title_bn") || "" }; o.subtitle = { en: f.get("sub_en") || "", bn: f.get("sub_bn") || "" };
      o.kind = e.target.value; draw(); return;
    }
    if (e.target.name === "scope") { o.target.all = e.target.value === "all"; modal.body.querySelector(".a-scope").hidden = o.target.all; }
    readTarget(); updateCount();
  });
  modal.body.addEventListener("input", (e) => {
    if (e.target.name === "brands") { readTarget(); updateCount(); }
    if (e.target.id === "o-find") {
      const q = e.target.value.trim().toLowerCase();
      const hits = q.length < 2 ? [] : state.products.filter((p) => !o.target.productIds.includes(p.id) && `${p.name} ${p.brand}`.toLowerCase().includes(q)).slice(0, 8);
      modal.body.querySelector("#o-found").innerHTML = hits.map((p) => `<button type="button" class="a-hit" data-add="${esc(p.id)}">${esc(p.name)} <small>${money(p.price)}</small></button>`).join("");
    }
  });
  modal.body.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { readTarget(); o.target.productIds.push(add.dataset.add); const keep = new FormData(modal.body.querySelector("#o-form")); o.title = { en: keep.get("title_en") || "", bn: keep.get("title_bn") || "" }; draw(); return; }
    const rm = e.target.closest("[data-rm]");
    if (rm) { readTarget(); o.target.productIds = o.target.productIds.filter((x) => x !== rm.dataset.rm); const keep = new FormData(modal.body.querySelector("#o-form")); o.title = { en: keep.get("title_en") || "", bn: keep.get("title_bn") || "" }; draw(); }
  });
  modal.body.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const err = modal.body.querySelector("#o-err");
    readTarget();
    const out = { ...o };
    out.title = { en: String(f.get("title_en") || "").trim(), bn: String(f.get("title_bn") || "").trim() };
    out.subtitle = { en: String(f.get("sub_en") || "").trim(), bn: String(f.get("sub_bn") || "").trim() };
    out.badge = String(f.get("badge") || "").trim();
    out.active = f.get("active") === "on";
    out.startsAt = String(f.get("startsAt") || "") || null;
    out.endsAt = String(f.get("endsAt") || "") || null;
    const problems = [];
    if (!out.title.en || !out.title.bn) problems.push("Enter the title in English and Bangla.");
    if (!out.subtitle.en) out.subtitle.en = out.subtitle.bn; if (!out.subtitle.bn) out.subtitle.bn = out.subtitle.en;
    if (out.kind === "discount") {
      out.type = String(f.get("type")); out.value = Number(f.get("value")); out.link = out.link || "/shop";
      if (!Number.isFinite(out.value) || out.value <= 0) problems.push("Enter a discount value above 0.");
      if (out.type === "percent" && out.value > 90) problems.push("A percentage discount can't be more than 90%.");
      const t = out.target;
      if (!t.all && !t.categories.length && !t.subs.length && !t.brands.length && !t.productIds.length) problems.push("Choose which products get the discount, or pick “Every product”.");
    } else { delete out.type; delete out.value; out.link = String(f.get("link") || "").trim(); out.target = { categories: [], subs: [], brands: [], productIds: [] }; }
    if (out.startsAt && out.endsAt && out.endsAt < out.startsAt) problems.push("The end date is before the start date.");
    if (problems.length) { err.textContent = problems.join(" "); return; }
    if (isNew) out.id = uniqueId(out.title.en, state.offers);
    const i = state.offers.findIndex((x) => x.id === out.id);
    if (i === -1) state.offers.push(out); else state.offers[i] = out;
    markDirty("offers"); renderOffers(); modal.close();
    toast("Saved — click “Publish changes” to update the site.");
  });
}

export function initOffers() {
  const panel = $("admin-panel-offers");
  if (!panel) return;
  panel.innerHTML = `<div class="admin-dashboard-head"><div><h2 class="admin-dashboard-title">Offers & discounts</h2><p class="admin-dashboard-sub">Set a discount for a category, brand or chosen products, with start and end dates. Prices on the site update by themselves — no need to edit each product.</p></div>
    <div class="admin-dashboard-actions"><button type="button" class="btn btn-primary btn-sm" id="o-add">${icon("plus")}<span>Add offer</span></button></div></div><div id="offers-root"></div>`;
  panel.addEventListener("click", (e) => {
    const card = e.target.closest(".a-card");
    const i = card ? Number(card.dataset.i) : -1;
    if (e.target.closest("#o-add")) offerEditor(null);
    else if (card && e.target.closest("[data-edit]")) offerEditor(state.offers[i]);
    else if (card && e.target.closest("[data-dup]")) { const c = JSON.parse(JSON.stringify(state.offers[i])); c.id = uniqueId(`${c.title.en} copy`, state.offers); c.title.en += " (copy)"; c.title.bn += " (কপি)"; c.active = false; state.offers.splice(i + 1, 0, c); markDirty("offers"); renderOffers(); }
    else if (card && e.target.closest("[data-del]")) { if (confirm(`Delete “${state.offers[i].title.en}”?`)) { state.offers.splice(i, 1); markDirty("offers"); renderOffers(); } }
  });
  onChange(renderOffers);
  renderOffers();
}

export { subLabel };
