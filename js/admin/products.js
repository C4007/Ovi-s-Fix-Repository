/* Ovi's Fix — admin: Products panel */
import { SUBS, CATEGORIES, STOCK, formatSpecValue } from "../catalog-schema.js";
import { esc, money, slugify, openModal, toast, mediaHTML, priceInfo, subLabel } from "../shop-core.js";
import { icon } from "../icons.js";
import { $, state, markDirty, onChange, uploadImage, resizeImage, download, csvCell, parseCSV, marketLinks, field, input, textarea } from "./core.js";

const view = { q: "", sub: "", stock: "", page: 1, selected: new Set() };
const PAGE = 25;
const subOptions = (selected = "", withAll = false) =>
  (withAll ? `<option value="">All categories</option>` : "") +
  Object.entries(CATEGORIES).map(([c, v]) => `<optgroup label="${esc(v.label.en)}">${v.subs.map((s) => `<option value="${s}" ${s === selected ? "selected" : ""}>${esc(SUBS[s].label.en)}</option>`).join("")}</optgroup>`).join("");
const stockOptions = (selected = "", withAll = false) =>
  (withAll ? `<option value="">All availability</option>` : "") + Object.entries(STOCK).map(([k, v]) => `<option value="${k}" ${k === selected ? "selected" : ""}>${v.en}</option>`).join("");

/* Fields the PC Builder needs to match parts — a product without them can never be offered as compatible. */
const REQUIRED_SPECS = {
  processor: ["socket"], motherboard: ["socket", "memType", "formFactor", "ramSlots"], ram: ["ramType", "ramSticks"],
  casing: ["boardSupport"], "cpu-cooler": ["socket"], "power-supply": ["watts"],
};

function filtered() {
  const q = view.q.trim().toLowerCase();
  return state.products.filter((p) =>
    (!view.sub || p.sub === view.sub) && (!view.stock || p.stock === view.stock) &&
    (!q || `${p.name} ${p.brand} ${p.id}`.toLowerCase().includes(q)));
}

export function renderProducts() {
  const root = $("products-root");
  if (!root) return;
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  if (view.page > pages) view.page = pages;
  const rows = list.slice((view.page - 1) * PAGE, view.page * PAGE);
  const allOnPage = rows.length && rows.every((p) => view.selected.has(p.id));
  const sel = view.selected.size;
  root.innerHTML = `
    <div class="a-toolbar">
      <input type="search" class="form-input a-search" id="p-q" placeholder="Search name, brand or ID…" value="${esc(view.q)}">
      <select class="form-input" id="p-sub">${subOptions(view.sub, true)}</select>
      <select class="form-input" id="p-stock">${stockOptions(view.stock, true)}</select>
      <span class="a-count">${list.length} of ${state.products.length} products</span>
    </div>
    ${sel ? `<div class="a-bulk"><strong>${sel} selected</strong>
      <select class="form-input" id="b-stock"><option value="">Set availability…</option>${stockOptions()}</select>
      <button type="button" class="btn btn-secondary btn-sm" id="b-pct">Change prices by %…</button>
      <button type="button" class="btn btn-secondary btn-sm" id="b-nosale">Remove sale prices</button>
      <button type="button" class="btn btn-secondary btn-sm danger-btn" id="b-del">Delete…</button>
      <button type="button" class="link-btn" id="b-clear">Clear selection</button></div>` : ""}
    <div class="a-table-wrap"><table class="a-table">
      <thead><tr><th><input type="checkbox" id="p-all" ${allOnPage ? "checked" : ""} aria-label="Select all on this page"></th><th></th><th>Product</th><th>Category</th><th class="num">Price (৳)</th><th class="num">Sale price (৳)</th><th>Availability</th><th></th></tr></thead>
      <tbody>${rows.map((p) => `<tr data-id="${esc(p.id)}">
        <td><input type="checkbox" data-sel ${view.selected.has(p.id) ? "checked" : ""} aria-label="Select"></td>
        <td class="a-thumb">${mediaHTML(p)}</td>
        <td class="a-name"><strong>${esc(p.name)}</strong><small>${esc(p.brand)}${p.featured ? " · ★ featured" : ""}</small></td>
        <td class="a-cat">${esc(subLabel(p.sub))}</td>
        <td class="num"><input type="number" min="0" class="form-input a-num" data-q="price" value="${p.price}"></td>
        <td class="num"><input type="number" min="0" class="form-input a-num" data-q="salePrice" value="${p.salePrice ?? ""}" placeholder="—"></td>
        <td><select class="form-input a-stock" data-q="stock">${stockOptions(p.stock)}</select></td>
        <td class="a-act"><button type="button" class="btn btn-secondary btn-sm" data-edit>Edit</button><button type="button" class="icon-btn" data-del aria-label="Delete">${icon("trash")}</button></td>
      </tr>`).join("") || `<tr><td colspan="8" class="a-empty">No products match. Try another search, or click “Add product”.</td></tr>`}</tbody>
    </table></div>
    ${pages > 1 ? `<div class="pager">${Array.from({ length: pages }, (_, i) => `<button type="button" data-pg="${i + 1}" class="${i + 1 === view.page ? "is-on" : ""}">${i + 1}</button>`).join("")}</div>` : ""}`;
}

/* ------------------------------------------------------------------ editor */
function specField(def, value) {
  const name = `spec.${def.key}`;
  const unit = def.unit ? ` (${def.unit})` : "";
  const label = `${def.label.en}${unit}`;
  const arr = Array.isArray(value) ? value : value === undefined || value === "" ? [] : [value];
  if (def.type === "multi") {
    if (def.opts) return field(label, `<div class="a-checks">${def.opts.map((o) => `<label class="check"><input type="checkbox" name="${name}" value="${esc(o)}" ${arr.includes(o) ? "checked" : ""}><span>${esc(o)}</span></label>`).join("")}</div>`, def.strict ? "Used by the PC Builder to match parts — tick every one that applies." : "", "full-width");
    return field(label, input(name, arr.join(", "), 'placeholder="Separate with commas"'), "", "full-width");
  }
  const v = arr[0] ?? "";
  if (def.opts && def.strict) return field(label, `<select class="form-input" name="${name}"><option value="">— choose —</option>${def.opts.map((o) => `<option value="${esc(o)}" ${String(v) === String(o) ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`, "Required for PC Builder matching.");
  if (def.opts) return field(label, `${input(name, v, `list="dl-${def.key}"`)}<datalist id="dl-${def.key}">${def.opts.map((o) => `<option value="${esc(o)}">`).join("")}</datalist>`);
  return field(label, input(name, v, def.type === "bucket" ? 'type="number" min="0"' : ""));
}

function specsHTML(sub, specs) {
  const defs = SUBS[sub]?.filters || [];
  return `<div class="admin-form-grid">${defs.map((d) => specField(d, specs?.[d.key])).join("")}</div>`;
}

function editor(existing) {
  const isNew = !existing;
  const p = existing ? JSON.parse(JSON.stringify(existing)) : { id: "", sub: view.sub || "processor", brand: "", name: "", price: 0, salePrice: null, stock: "in", image: "", desc: "", specs: {}, tdp: null, perf: null, igpu: null, featured: false, createdAt: Date.now() };
  const pending = { dataUrl: "", remove: false };
  const modal = openModal({ title: isNew ? "Add product" : "Edit product", wide: true, className: "admin-modal" });
  const sub = () => modal.body.querySelector('[name="sub"]').value;

  const draw = () => {
    const s = SUBS[p.sub];
    modal.body.innerHTML = `<form id="p-form" novalidate>
      <div class="admin-form-grid">
        ${field("Product name *", input("name", p.name, "required"), "", "full-width")}
        ${field("Brand", input("brand", p.brand))}
        ${field("Category *", `<select class="form-input" name="sub">${subOptions(p.sub)}</select>`, isNew ? "Choosing the category shows the right specification fields below." : "")}
        ${field("Price (৳) *", input("price", p.price, 'type="number" min="0"'))}
        ${field("Sale price (৳)", input("salePrice", p.salePrice ?? "", 'type="number" min="0" placeholder="leave empty for no discount"'), "Shows the regular price crossed out.")}
        ${field("Availability", `<select class="form-input" name="stock">${stockOptions(p.stock)}</select>`, "Pre-order = we can order it for the customer.")}
        <div class="form-group"><label class="form-label">Show as featured</label><label class="check"><input type="checkbox" name="featured" ${p.featured ? "checked" : ""}><span>Popular pick (shown on Shop and ordered first)</span></label></div>
        ${field("Short description (optional)", textarea("desc", p.desc), "", "full-width")}
      </div>
      <h3 class="a-sub">Photo</h3>
      <div class="a-photo">
        <div class="a-photo-prev" id="p-prev">${pending.dataUrl ? `<img src="${pending.dataUrl}" alt="">` : pending.remove ? mediaHTML({ ...p, image: "" }) : mediaHTML(p)}</div>
        <div class="a-photo-ctl">
          <label class="btn btn-secondary btn-sm">${icon("upload")}<span>Upload photo</span><input type="file" id="p-file" accept="image/*" hidden></label>
          <button type="button" class="btn btn-ghost btn-sm" id="p-rmimg">Remove photo</button>
          <p class="admin-id-hint">Photos are resized to 900px automatically. Or paste a link (https://…) below instead.</p>
          ${input("image", /^data:/.test(p.image) ? "" : p.image, 'placeholder="Photo link (optional)"')}
        </div>
      </div>
      <h3 class="a-sub">Specifications — ${esc(s.label.en)}</h3>
      <p class="admin-id-hint">Used for the filters on the shop and for the PC Builder's compatibility checks. Technical values stay in English.</p>
      ${specsHTML(p.sub, p.specs)}
      ${s.power || s.perf ? `<h3 class="a-sub">PC Builder numbers</h3><div class="admin-form-grid">
        ${s.power ? field("Power draw (W)", input("tdp", p.tdp ?? "", 'type="number" min="0"'), "Highest power this part uses — used for the wattage estimate.") : ""}
        ${s.perf ? field("Performance score", input("perf", p.perf ?? "", 'type="number" min="0"'), p.sub === "processor" ? "Gaming score — Ryzen 5 5600 = 100." : "Gaming score — RTX 4060 = 100.") : ""}
        ${p.sub === "processor" ? field("Built-in graphics score", input("igpu", p.igpu ?? "", 'type="number" min="0"'), "Leave empty if the CPU has no built-in graphics.") : ""}</div>` : ""}
      ${p.name ? `<h3 class="a-sub">Check market price</h3><div class="a-links">${marketLinks(p.name).map(([n, u]) => `<a class="chip" target="_blank" rel="noopener" href="${esc(u)}">${esc(n)}</a>`).join("")}</div>` : ""}
      <p class="form-msg is-error" id="p-err" role="alert"></p>
      <div class="a-modal-foot"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="submit" class="btn btn-primary">${isNew ? "Add product" : "Save product"}</button></div>
    </form>`;
  };
  draw();

  const collect = () => {
    const f = new FormData(modal.body.querySelector("#p-form"));
    const out = { ...p, specs: {} };
    out.name = String(f.get("name") || "").trim();
    out.brand = String(f.get("brand") || "").trim();
    out.sub = String(f.get("sub"));
    out.price = Number(f.get("price"));
    out.salePrice = f.get("salePrice") === "" || f.get("salePrice") === null ? null : Number(f.get("salePrice"));
    out.stock = String(f.get("stock"));
    out.featured = f.get("featured") === "on";
    out.desc = String(f.get("desc") || "").trim();
    for (const k of ["tdp", "perf", "igpu"]) { const v = f.get(k); out[k] = v === null || v === "" ? null : Number(v); }
    for (const def of SUBS[out.sub].filters) {
      const name = `spec.${def.key}`;
      if (def.type === "multi") {
        const vals = def.opts ? f.getAll(name).map(String) : String(f.get(name) || "").split(",").map((x) => x.trim()).filter(Boolean);
        if (vals.length) out.specs[def.key] = vals;
      } else {
        const v = String(f.get(name) ?? "").trim();
        if (v !== "") out.specs[def.key] = def.type === "bucket" || (/^\d+(\.\d+)?$/.test(v) && def.unit) ? Number(v) : v;
      }
    }
    if (out.sub === "motherboard" && !out.specs.processorType && out.specs.socket) out.specs.processorType = /^AM/i.test(out.specs.socket) ? "AMD" : /^LGA/i.test(out.specs.socket) ? "Intel" : "";
    if (!out.specs.processorType) delete out.specs.processorType;
    out.image = String(f.get("image") || "").trim() || (pending.remove ? "" : /^data:/.test(p.image) ? "" : p.image);
    if (pending.remove && !String(f.get("image") || "").trim()) out.image = "";
    return out;
  };

  modal.body.addEventListener("change", async (e) => {
    if (e.target.name === "sub") { const keep = collect(); keep.specs = {}; Object.assign(p, keep, { sub: sub() }); draw(); return; }
    if (e.target.id === "p-file" && e.target.files[0]) {
      try {
        pending.dataUrl = await resizeImage(e.target.files[0]); pending.remove = false;
        modal.body.querySelector("#p-prev").innerHTML = `<img src="${pending.dataUrl}" alt="">`;
      } catch (err) { modal.body.querySelector("#p-err").textContent = err.message; }
    }
  });
  modal.body.addEventListener("click", (e) => {
    if (e.target.closest("#p-rmimg")) { pending.dataUrl = ""; pending.remove = true; const keep = collect(); keep.image = ""; Object.assign(p, keep); draw(); }
  });
  modal.body.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = modal.body.querySelector("#p-err");
    const out = collect();
    const problems = [];
    if (!out.name) problems.push("Enter a product name.");
    if (!Number.isFinite(out.price) || out.price < 0) problems.push("Enter a valid price.");
    if (out.salePrice !== null && (!Number.isFinite(out.salePrice) || out.salePrice < 0)) problems.push("Sale price must be a number.");
    for (const k of REQUIRED_SPECS[out.sub] || []) {
      const v = out.specs[k];
      if (v === undefined || (Array.isArray(v) && !v.length)) problems.push(`${SUBS[out.sub].filters.find((d) => d.key === k).label.en} is required so the PC Builder can match this part.`);
    }
    if (problems.length) { err.textContent = problems.join(" "); return; }
    if (isNew) {
      let id = slugify(out.name), n = 2;
      while (state.products.some((x) => x.id === id)) id = `${slugify(out.name)}-${n++}`;
      out.id = id;
    }
    if (pending.dataUrl) {
      const btn = e.submitter; if (btn) { btn.disabled = true; btn.textContent = "Uploading photo…"; }
      const r = await uploadImage(out.id, pending.dataUrl);
      if (!r.ok) { err.textContent = r.error; if (btn) { btn.disabled = false; btn.textContent = "Save product"; } return; }
      out.image = r.url;
    }
    out.createdAt = out.createdAt || Date.now();
    const i = state.products.findIndex((x) => x.id === out.id);
    if (i === -1) state.products.unshift(out); else state.products[i] = out;
    markDirty("products");
    renderProducts();
    modal.close();
    toast(isNew ? "Product added — click “Publish changes” to put it on the site." : "Saved — click “Publish changes” to update the site.");
  });
}

/* ------------------------------------------------------------ usage checks */
function usedIn(id) {
  const inBuilds = state.builds.filter((b) => b.parts.some((x) => x.id === id)).map((b) => b.name.en);
  const inOffers = state.offers.filter((o) => (o.target?.productIds || []).includes(id)).map((o) => o.title.en);
  return [...inBuilds.map((n) => `pre-built PC “${n}”`), ...inOffers.map((n) => `offer “${n}”`)];
}

function deleteProducts(ids) {
  const used = ids.flatMap((id) => usedIn(id).map((u) => `${state.products.find((p) => p.id === id)?.name}: ${u}`));
  const warn = used.length ? `\n\nHeads up — these are still used:\n• ${used.slice(0, 6).join("\n• ")}${used.length > 6 ? "\n• …" : ""}` : "";
  if (!confirm(`Delete ${ids.length} product${ids.length > 1 ? "s" : ""}? This can't be undone after you publish.${warn}`)) return;
  state.products = state.products.filter((p) => !ids.includes(p.id));
  ids.forEach((id) => view.selected.delete(id));
  markDirty("products"); renderProducts();
}

/* ----------------------------------------------------------- CSV round-trip */
function exportCSV() {
  const head = ["id", "name", "brand", "category", "price", "salePrice", "stock"];
  const lines = [head.join(",")].concat(state.products.map((p) => [p.id, p.name, p.brand, p.sub, p.price, p.salePrice ?? "", p.stock].map(csvCell).join(",")));
  download(`ovisfix-prices-${new Date().toISOString().slice(0, 10)}.csv`, "\ufeff" + lines.join("\n"), "text/csv");
  toast("Price list downloaded — edit it in Excel, then use “Import prices”.");
}
async function importCSV(file) {
  const rows = parseCSV((await file.text()).replace(/^\ufeff/, ""));
  const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
  const col = (n) => head.indexOf(n.toLowerCase());
  if (col("id") === -1) { toast("The file needs an “id” column (use the exported file).", { kind: "warn" }); return; }
  let updated = 0; const missing = []; const bad = [];
  for (const r of rows) {
    const p = state.products.find((x) => x.id === (r[col("id")] || "").trim());
    if (!p) { missing.push(r[col("id")]); continue; }
    const set = (key, parse) => { const c = col(key); if (c === -1) return; const raw = (r[c] ?? "").trim(); const v = parse(raw); if (v === undefined) bad.push(`${p.id} (${key})`); else p[key] = v; };
    set("price", (s) => (s !== "" && Number(s) >= 0 ? Number(s) : undefined));
    set("salePrice", (s) => (s === "" ? null : Number(s) >= 0 ? Number(s) : undefined));
    set("stock", (s) => (STOCK[s] ? s : undefined));
    set("name", (s) => (s ? s : undefined));
    set("brand", (s) => s);
    updated++;
  }
  if (updated) markDirty("products");
  renderProducts();
  toast(`Updated ${updated} products${missing.length ? `, ${missing.length} unknown id(s) skipped` : ""}${bad.length ? `, ${bad.length} bad value(s) skipped` : ""}.`, { ms: 6000 });
}

/* ------------------------------------------------------------------ wiring */
export function initProducts() {
  const panel = $("admin-panel-products");
  if (!panel) return;
  panel.innerHTML = `
    <div class="admin-dashboard-head"><div><h2 class="admin-dashboard-title">Products</h2>
      <p class="admin-dashboard-sub">Add, edit and remove products with prices and photos. Change a price or availability right in the table.</p></div>
      <div class="admin-dashboard-actions"><button type="button" class="btn btn-secondary btn-sm" id="p-csv-out">${icon("download")}<span>Export prices (CSV)</span></button>
        <label class="btn btn-secondary btn-sm">${icon("upload")}<span>Import prices (CSV)</span><input type="file" id="p-csv-in" accept=".csv,text/csv" hidden></label>
        <button type="button" class="btn btn-primary btn-sm" id="p-add">${icon("plus")}<span>Add product</span></button></div></div>
    <div id="products-root"></div>`;
  panel.addEventListener("input", (e) => {
    if (e.target.id === "p-q") { view.q = e.target.value; view.page = 1; renderProducts(); const el = $("p-q"); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  });
  panel.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "p-sub") { view.sub = t.value; view.page = 1; renderProducts(); }
    else if (t.id === "p-stock") { view.stock = t.value; view.page = 1; renderProducts(); }
    else if (t.id === "p-all") { filtered().slice((view.page - 1) * PAGE, view.page * PAGE).forEach((p) => (t.checked ? view.selected.add(p.id) : view.selected.delete(p.id))); renderProducts(); }
    else if (t.matches("[data-sel]")) { const id = t.closest("tr").dataset.id; t.checked ? view.selected.add(id) : view.selected.delete(id); renderProducts(); }
    else if (t.dataset.q) {
      const p = state.products.find((x) => x.id === t.closest("tr").dataset.id);
      if (!p) return;
      if (t.dataset.q === "stock") p.stock = t.value;
      else { const v = t.value === "" ? null : Number(t.value); if (t.dataset.q === "price" && (v === null || v < 0)) { t.value = p.price; return; } p[t.dataset.q] = v; }
      markDirty("products");
    } else if (t.id === "b-stock" && t.value) { state.products.filter((p) => view.selected.has(p.id)).forEach((p) => (p.stock = t.value)); markDirty("products"); renderProducts(); }
    else if (t.id === "p-csv-in" && t.files[0]) { importCSV(t.files[0]); t.value = ""; }
  });
  panel.addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-id]");
    if (e.target.closest("#p-add")) editor(null);
    else if (e.target.closest("#p-csv-out")) exportCSV();
    else if (tr && e.target.closest("[data-edit]")) editor(state.products.find((p) => p.id === tr.dataset.id));
    else if (tr && e.target.closest("[data-del]")) deleteProducts([tr.dataset.id]);
    else if (e.target.closest("[data-pg]")) { view.page = Number(e.target.closest("[data-pg]").dataset.pg); renderProducts(); }
    else if (e.target.closest("#b-clear")) { view.selected.clear(); renderProducts(); }
    else if (e.target.closest("#b-del")) deleteProducts([...view.selected]);
    else if (e.target.closest("#b-nosale")) { state.products.filter((p) => view.selected.has(p.id)).forEach((p) => (p.salePrice = null)); markDirty("products"); renderProducts(); }
    else if (e.target.closest("#b-pct")) {
      const v = prompt("Change the price of the selected products by how many percent?\n(Example: 5 raises by 5%, -10 lowers by 10%)", "5");
      const n = Number(v);
      if (v === null || !Number.isFinite(n) || n <= -90 || n > 200) return;
      state.products.filter((p) => view.selected.has(p.id)).forEach((p) => { p.price = Math.round((p.price * (1 + n / 100)) / 10) * 10; if (p.salePrice !== null) p.salePrice = Math.round((p.salePrice * (1 + n / 100)) / 10) * 10; });
      markDirty("products"); renderProducts();
    }
  });
  onChange(renderProducts);
  renderProducts();
}

export { formatSpecValue, money, priceInfo };
