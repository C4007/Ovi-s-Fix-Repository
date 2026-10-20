/* Ovi's Fix — admin: Overview (status, backup & restore) and Store settings panels */
import { STOCK } from "../catalog-schema.js";
import { esc, toast, waLink } from "../shop-core.js";
import { icon } from "../icons.js";
import { offerActive } from "../shop-core.js";
import { $, state, markDirty, onChange, publish, download, field, input, textarea, loadState } from "./core.js";

/* ================================================================ overview */
export function renderOverview() {
  const root = $("overview-root");
  if (!root) return;
  const p = state.products;
  const count = (k) => p.filter((x) => x.stock === k).length;
  const unsaved = ["products", "builds", "offers", "store"].filter((k) => !state.saved[k]);
  const live = state.offers.filter((o) => offerActive(o)).length;
  const dbOk = state.source === "kv";
  root.innerHTML = `
    ${dbOk ? "" : `<div class="a-alert bad">${icon("alert")}<div><strong>The database is not connected.</strong> You can look around, but “Publish changes” will fail until you add <code>UPSTASH_REDIS_REST_URL</code> and <code>UPSTASH_REDIS_REST_TOKEN</code> in your hosting settings (see README). The site shows the starter catalog until then.</div></div>`}
    ${dbOk && unsaved.length ? `<div class="a-alert info">${icon("info")}<div><strong>You are looking at the starter data that came with the site.</strong> It is not saved in your database yet. Save it once, then edit anything you like.
      <div><button type="button" class="btn btn-primary btn-sm" id="ov-seed">Save starter data to my database</button></div></div></div>` : ""}
    <div class="a-stats">
      <div class="a-stat"><small>Products</small><b>${p.length}</b><span>${count("in")} in stock · ${count("pre")} pre-order · ${count("out")} out</span></div>
      <div class="a-stat"><small>Pre-built PCs</small><b>${state.builds.filter((b) => b.active !== false).length}</b><span>shown on the site</span></div>
      <div class="a-stat"><small>Offers</small><b>${live}</b><span>live right now (${state.offers.length} total)</span></div>
      <div class="a-stat"><small>On sale</small><b>${p.filter((x) => x.salePrice !== null && x.salePrice < x.price).length}</b><span>products with a sale price</span></div>
    </div>
    <div class="admin-form-grid a-two">
      <section class="a-box"><h3>Keep prices honest</h3>
        <p class="admin-id-hint">Prices were first filled in from these shops. Check them often — RAM, SSD and graphics card prices move quickly.</p>
        <div class="a-links"><a class="chip" target="_blank" rel="noopener" href="https://www.startech.com.bd/component">Star Tech</a><a class="chip" target="_blank" rel="noopener" href="https://www.ryans.com/category/computer-desktop-component">Ryans</a><a class="chip" target="_blank" rel="noopener" href="https://www.techlandbd.com/pc-components">Techland</a><a class="chip" target="_blank" rel="noopener" href="https://www.computervillage.com.bd/component">Computer Village</a></div>
        <p class="admin-id-hint">Tip: in Products, click <b>Export prices (CSV)</b>, update the prices in Excel, then <b>Import prices (CSV)</b>. Or open a product and use its “Check market price” links.</p></section>
      <section class="a-box"><h3>Quick links</h3><div class="a-links">
        <a class="chip" target="_blank" href="/shop">Shop</a><a class="chip" target="_blank" href="/components">Stock &amp; price list</a><a class="chip" target="_blank" href="/pc-builder">PC Builder</a><a class="chip" target="_blank" href="/builds">Pre-built PCs</a><a class="chip" target="_blank" href="/offers">Offers</a><a class="chip" target="_blank" rel="noopener" href="${esc(waLink("Test message from the admin panel"))}">Test WhatsApp button</a></div></section>
      <section class="a-box"><h3>Backup &amp; restore</h3>
        <p class="admin-id-hint">Download everything (products, pre-built PCs, offers, store settings) as one file. Restoring loads it here — you still click “Publish changes” to make it live.</p>
        <div class="a-links"><button type="button" class="btn btn-secondary btn-sm" id="ov-export">${icon("download")}<span>Download backup</span></button>
        <label class="btn btn-secondary btn-sm">${icon("upload")}<span>Restore from backup</span><input type="file" id="ov-import" accept=".json,application/json" hidden></label></div></section>
      <section class="a-box"><h3>Good to know</h3><ul class="a-tips">
        <li>Products start as <b>Pre-order</b>. Switch the ones you really hold to <b>In stock</b>.</li>
        <li>Offers change prices by themselves between their start and end dates.</li>
        <li>The PC Builder only needs <b>Socket, Memory Type, Form Factor, RAM Slots</b> filled in on motherboards (and socket / RAM type on CPUs and RAM) to match parts.</li>
        <li>Photos are resized for you, so any phone photo works.</li></ul></section>
    </div>`;
}

export function initOverview() {
  const panel = $("admin-panel-overview");
  if (!panel) return;
  panel.innerHTML = `<div class="admin-dashboard-head"><div><h2 class="admin-dashboard-title">Overview</h2><p class="admin-dashboard-sub">Your shop at a glance.</p></div></div><div id="overview-root"></div>`;
  panel.addEventListener("click", async (e) => {
    if (e.target.closest("#ov-seed")) { ["products", "builds", "offers", "store"].forEach((k) => { if (!state.saved[k]) markDirty(k); }); await publish(); renderOverview(); }
    if (e.target.closest("#ov-export")) {
      download(`ovisfix-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: "ovisfix-shop", version: 1, exportedAt: new Date().toISOString(), products: state.products, builds: state.builds, offers: state.offers, store: state.store }, null, 2), "application/json");
      toast("Backup downloaded.");
    }
  });
  panel.addEventListener("change", async (e) => {
    if (e.target.id !== "ov-import" || !e.target.files[0]) return;
    try {
      const d = JSON.parse(await e.target.files[0].text());
      if (d.app !== "ovisfix-shop" || !Array.isArray(d.products) || !Array.isArray(d.builds) || !Array.isArray(d.offers) || typeof d.store !== "object") throw new Error("bad file");
      if (!confirm(`Load ${d.products.length} products, ${d.builds.length} pre-built PCs and ${d.offers.length} offers from this backup? Nothing goes live until you click “Publish changes”.`)) return;
      state.products = d.products; state.builds = d.builds; state.offers = d.offers; state.store = { ...state.store, ...d.store };
      ["products", "builds", "offers", "store"].forEach(markDirty);
      document.dispatchEvent(new CustomEvent("ovisfix:admin-state"));
      toast("Backup loaded — review it, then click “Publish changes”.", { ms: 6000 });
    } catch (err) { toast("That doesn't look like an Ovi's Fix backup file.", { kind: "warn" }); }
    e.target.value = "";
  });
  onChange(renderOverview);
  document.addEventListener("ovisfix:admin-state", () => { import("./core.js").then((c) => { c.paintPublishBar(); }); renderOverview(); });
  renderOverview();
}

/* ============================================================ store settings */
const LOC = [
  ["address", "Address", true], ["heroTitle", "Home page headline", false], ["heroSub", "Home page sub-headline", true],
  ["freeServiceNote", "Free service charge message", true], ["preorderNote", "Pre-order message", false], ["tcNote", "“Terms apply” link text", false], ["priceNote", "Price disclaimer", true],
];

export function renderStore() {
  const root = $("store-root");
  if (!root) return;
  const s = state.store;
  const loc = ([k, label, long]) => `${field(`${label} — English`, long ? textarea(`${k}_en`, s[k]?.en || "") : input(`${k}_en`, s[k]?.en || ""))}${field(`${label} — Bangla`, long ? textarea(`${k}_bn`, s[k]?.bn || "") : input(`${k}_bn`, s[k]?.bn || ""))}`;
  root.innerHTML = `<form id="store-form" novalidate>
    <section class="a-box"><h3>Contact & WhatsApp</h3><div class="admin-form-grid">
      ${field("WhatsApp number *", input("whatsapp", s.whatsapp || "", 'inputmode="numeric" placeholder="8801948977199"'), "Digits only, with country code and no + or spaces. The floating WhatsApp button and every “Ask an expert” link use this number.")}
      ${field("First message in WhatsApp", input("whatsappMessage", s.whatsappMessage || ""), "What the customer's message starts with when they tap the green button.")}
      ${field("Phone", input("phone", s.phone || ""))}${field("Second phone", input("altPhone", s.altPhone || ""))}${field("Email", input("email", s.email || "", 'type="email"'))}
      ${loc(LOC[0])}</div></section>
    <section class="a-box"><h3>Social links</h3><div class="admin-form-grid">
      ${field("Facebook", input("facebook", s.facebook || "", 'placeholder="https://…"'))}${field("Instagram", input("instagram", s.instagram || "", 'placeholder="https://…"'))}${field("YouTube", input("youtube", s.youtube || "", 'placeholder="https://…"'))}${field("LinkedIn", input("linkedin", s.linkedin || "", 'placeholder="https://…"'))}</div></section>
    <section class="a-box"><h3>Home page</h3><div class="admin-form-grid">${loc(LOC[1])}${loc(LOC[2])}</div></section>
    <section class="a-box"><h3>Free service charge, pre-orders & price note</h3><div class="admin-form-grid">${loc(LOC[3])}${loc(LOC[4])}${loc(LOC[5])}${loc(LOC[6])}</div>
      <p class="admin-id-hint">These lines appear on the home page, the shop, the PC Builder, pre-built PCs, the cart and the footer. The full terms live on the Terms page.</p></section>
    <p class="form-msg" id="store-msg" role="status"></p>
    <div class="a-modal-foot"><button type="submit" class="btn btn-primary">Apply changes</button></div>
  </form>`;
}

export function initStore() {
  const panel = $("admin-panel-store");
  if (!panel) return;
  panel.innerHTML = `<div class="admin-dashboard-head"><div><h2 class="admin-dashboard-title">Store settings</h2><p class="admin-dashboard-sub">Contact details, the WhatsApp number and the messages shown across the shop.</p></div></div><div id="store-root"></div>`;
  panel.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const msg = $("store-msg");
    const wa = String(f.get("whatsapp") || "").replace(/\D/g, "");
    if (!/^\d{8,15}$/.test(wa)) { msg.textContent = "Enter the WhatsApp number as digits only with the country code, e.g. 8801948977199."; msg.className = "form-msg is-error"; return; }
    const next = { ...state.store, whatsapp: wa };
    for (const k of ["whatsappMessage", "phone", "altPhone", "email", "facebook", "instagram", "youtube", "linkedin"]) next[k] = String(f.get(k) || "").trim();
    for (const [k] of LOC) {
      const en = String(f.get(`${k}_en`) || "").trim(), bn = String(f.get(`${k}_bn`) || "").trim();
      next[k] = { en: en || bn, bn: bn || en };
    }
    state.store = next;
    markDirty("store");
    msg.textContent = "Applied. Click “Publish changes” to put it on the live site."; msg.className = "form-msg is-ok";
    toast("Saved — click “Publish changes” to update the site.");
  });
  onChange(renderStore);
  renderStore();
}

export { loadState, STOCK };
