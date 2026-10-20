/* Ovi's Fix — admin core: shared state, the "Publish changes" bar, API helpers, image resizing, CSV helpers. */
import { loadShop, resetShopCache, toast, esc } from "../shop-core.js";

export const $ = (id) => document.getElementById(id);
export const state = { products: [], builds: [], offers: [], store: {}, saved: {}, source: "" };
export const dirty = { products: false, builds: false, offers: false, store: false };
const LABELS = { products: "Products", builds: "Pre-built PCs", offers: "Offers", store: "Store settings" };
const listeners = new Set();
export const onChange = (fn) => listeners.add(fn);
const clone = (v) => JSON.parse(JSON.stringify(v));

export async function loadState() {
  resetShopCache();
  const d = await loadShop();
  state.products = clone(d.products);
  state.builds = clone(d.builds);
  state.offers = clone(d.offers);
  state.store = clone(d.store);
  state.saved = { ...d.saved };
  state.source = d.source;
  for (const k of Object.keys(dirty)) dirty[k] = false;
  paintPublishBar();
  listeners.forEach((fn) => fn());
}

export function markDirty(key) { dirty[key] = true; paintPublishBar(); }

export function paintPublishBar() {
  const bar = $("shop-publish-bar");
  if (!bar) return;
  const keys = Object.keys(dirty).filter((k) => dirty[k]);
  bar.hidden = !keys.length;
  bar.innerHTML = keys.length
    ? `<span class="pub-dot"></span><span><strong>Unpublished changes:</strong> ${keys.map((k) => LABELS[k]).join(", ")}. Visitors do not see them until you publish.</span>
       <button type="button" class="btn btn-secondary btn-sm" id="pub-discard">Discard</button>
       <button type="button" class="btn btn-primary btn-sm" id="pub-save">Publish changes</button>`
    : "";
}

export async function api(path, body) {
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.success !== false, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: "Network error — could not reach the server." } };
  }
}

export async function publish() {
  const btn = $("pub-save");
  if (btn) { btn.disabled = true; btn.textContent = "Publishing…"; }
  for (const key of ["products", "builds", "offers", "store"]) {
    if (!dirty[key]) continue;
    const r = await api("/api/admin/shop", { key, data: state[key] });
    if (!r.ok) {
      toast(`${LABELS[key]}: ${r.data.error || "could not save"}`, { kind: "warn", ms: 7000 });
      paintPublishBar();
      return false;
    }
    dirty[key] = false;
    state.saved[key] = true;
  }
  paintPublishBar();
  toast("Published — your site is updated.");
  listeners.forEach((fn) => fn());
  return true;
}

export async function discard() {
  if (!confirm("Discard all unpublished changes?")) return;
  await loadState();
  toast("Changes discarded.");
}

export async function uploadImage(id, dataUrl) {
  const r = await api("/api/admin/image", { id, dataUrl });
  return r.ok ? { ok: true, url: r.data.url } : { ok: false, error: r.data.error || "Upload failed" };
}
export const removeImage = (id) => api("/api/admin/image", { id, remove: true });

/** Shrinks a photo to at most `max` px (WebP, or JPEG where WebP isn't supported) so it stays small and fast. */
export function resizeImage(file, max = 900) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp|gif)/.test(file.type)) return reject(new Error("Please choose a JPG, PNG or WebP image."));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); // product photos sit on white
      g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let out = c.toDataURL("image/webp", 0.82);
      if (!out.startsWith("data:image/webp")) out = c.toDataURL("image/jpeg", 0.85);
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read that image.")); };
    img.src = url;
  });
}

export function download(filename, text, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

/* ---- tiny CSV (RFC 4180 style) ---- */
export const csvCell = (v) => { const s = String(v ?? ""); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

export function marketLinks(name) {
  const q = encodeURIComponent(name.replace(/\s+/g, " ").trim());
  const g = (site) => `https://www.google.com/search?q=${encodeURIComponent(name)}+site%3A${site}`;
  return [
    ["Star Tech", `https://www.startech.com.bd/product/search?search=${q}`],
    ["Ryans", `https://www.ryans.com/search?q=${q}`],
    ["Techland", g("techlandbd.com")],
    ["Computer Village", g("computervillage.com.bd")],
  ];
}

export const field = (label, inner, hint = "", cls = "") => `<div class="form-group ${cls}"><label class="form-label">${esc(label)}</label>${inner}${hint ? `<p class="admin-id-hint">${esc(hint)}</p>` : ""}</div>`;
export const input = (name, value = "", attrs = "") => `<input class="form-input" name="${name}" value="${esc(value)}" ${attrs}>`;
export const textarea = (name, value = "", attrs = "") => `<textarea class="form-input" name="${name}" rows="3" ${attrs}>${esc(value)}</textarea>`;

document.addEventListener("click", (e) => {
  if (e.target.closest("#pub-save")) publish();
  if (e.target.closest("#pub-discard")) discard();
});
window.addEventListener("beforeunload", (e) => {
  if (Object.values(dirty).some(Boolean)) { e.preventDefault(); e.returnValue = ""; }
});
