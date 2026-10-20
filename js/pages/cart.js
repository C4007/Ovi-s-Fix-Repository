/* Ovi's Fix — /cart : review items, then order on WhatsApp or send an order request. */
import { boot } from "/js/boot.js";
import { T, loc, esc, money, shop, cart, getProduct, setPageMeta, priceInfo, mediaHTML, stockLabel, waLink, buildOrderText, orderLines, toast, productUrl } from "/js/shop-core.js";
import { icon } from "/js/icons.js";
import { stockPill } from "/js/shop-ui.js";
import { pageHeader } from "/js/blocks.js";

const FORM_KEY = "ovisfix-checkout";
const readForm = () => { try { return JSON.parse(sessionStorage.getItem(FORM_KEY) || "{}") || {}; } catch (e) { return {}; } };
let sending = false;

function formValues(root) {
  const f = root.querySelector("#order-form");
  if (!f) return {};
  const v = Object.fromEntries(new FormData(f).entries());
  try { sessionStorage.setItem(FORM_KEY, JSON.stringify(v)); } catch (e) { /* ignore */ }
  return v;
}

function render() {
  const root = document.getElementById("page-root");
  const store = shop().store;
  const items = cart.read().filter((i) => getProduct(i.id));
  const gone = cart.read().length - items.length;
  const head = pageHeader({ crumbs: [{ label: T("nav.cart") }], title: T("cart.title") });
  setPageMeta(T("cart.title"));
  if (!items.length) {
    root.innerHTML = `${head}<section class="section-tight"><div class="container"><div class="empty"><div class="empty-ic">${icon("cart")}</div><h3>${esc(T("cart.empty"))}</h3><p>${esc(T("cart.emptyHint"))}</p>
      <div class="empty-actions"><a class="btn btn-primary btn-sm" href="/shop">${esc(T("cart.continue"))}</a><a class="btn btn-secondary btn-sm" href="/pc-builder">${esc(T("home.openBuilder"))}</a></div></div></div></section>`;
    return;
  }
  const { total } = orderLines(items);
  const meta = cart.meta();
  const saved = readForm();
  const lines = items.map((i) => {
    const p = getProduct(i.id);
    const info = priceInfo(p);
    return `<li class="cart-line" data-id="${esc(p.id)}">
      <a class="cart-media" href="${productUrl(p)}">${mediaHTML(p)}</a>
      <div class="cart-main">
        <a class="cart-name" href="${productUrl(p)}">${esc(p.name)}</a>
        <div class="cart-meta">${stockPill(p)}${info.onSale ? `<s>${money(info.regular)}</s>` : ""}<span>${money(info.price)} ${esc(T("cart.each"))}</span></div>
        ${p.stock === "out" || p.stock === "soon" ? `<p class="pnote bad">${icon("alert")}${esc(T("cart.unavailable"))}</p>` : ""}
      </div>
      <div class="qty" role="group" aria-label="${esc(T("cart.qty"))}"><button type="button" data-qd="-1" aria-label="−">${icon("minus")}</button><output>${i.qty}</output><button type="button" data-qd="1" aria-label="+">${icon("plus")}</button></div>
      <div class="cart-line-price">${money(info.price * i.qty)}</div>
      <button type="button" class="icon-btn" data-rm aria-label="${esc(T("cart.remove"))}">${icon("trash")}</button>
    </li>`;
  }).join("");
  root.innerHTML = `${head}
  <section class="section-tight"><div class="container">
    ${gone ? `<p class="pnote warn">${icon("alert")}${esc(T("cart.goneNote"))}</p>` : ""}
    <div class="cart-grid">
      <ul class="cart-list">${lines}</ul>
      <aside class="cart-summary">
        <h2>${esc(T("cart.summary"))}</h2>
        <dl>
          <div><dt>${esc(T("cart.subtotal"))}</dt><dd>${money(total)}</dd></div>
          <div><dt>${esc(T("builder.serviceCharge"))}</dt><dd class="${meta.fromBuilder ? "free" : ""}">${meta.fromBuilder ? "৳0" : esc(T("cart.serviceNa"))}</dd></div>
          <div class="grand"><dt>${esc(T("builder.total"))}</dt><dd>${money(total)}</dd></div>
        </dl>
        ${meta.fromBuilder ? `<p class="free-note">${icon("check")}${esc(loc(store.freeServiceNote))}</p>` : ""}
        <p class="price-note small">${icon("info")}<span>${esc(loc(store.priceNote))}</span></p>
        <form id="order-form" novalidate>
          <label><span>${esc(T("cart.name"))} *</span><input name="name" required autocomplete="name" value="${esc(saved.name || "")}"></label>
          <label><span>${esc(T("cart.phone"))} *</span><input name="phone" required inputmode="tel" autocomplete="tel" value="${esc(saved.phone || "")}"></label>
          <label><span>${esc(T("cart.address"))}</span><input name="address" autocomplete="street-address" value="${esc(saved.address || "")}"></label>
          <label><span>${esc(T("cart.note"))}</span><textarea name="note" rows="2" placeholder="${esc(T("cart.notePlaceholder"))}">${esc(saved.note || "")}</textarea></label>
          <button type="button" class="btn btn-primary btn-block" id="order-wa">${icon("whatsapp")}<span>${esc(T("cart.orderWa"))}</span></button>
          <button type="button" class="btn btn-secondary btn-block" id="order-send">${icon("send")}<span>${esc(T("cart.orderSend"))}</span></button>
          <p class="form-msg" id="order-msg" role="status"></p>
        </form>
        <button type="button" class="link-btn danger" id="clear-cart">${esc(T("cart.clear"))}</button>
      </aside>
    </div>
  </div></section>`;
}

function validate(root) {
  const v = formValues(root);
  const msg = root.querySelector("#order-msg");
  msg.className = "form-msg";
  if (!v.name?.trim() || (v.phone || "").replace(/\D/g, "").length < 7) {
    msg.textContent = T("cart.needContact");
    msg.classList.add("is-error");
    root.querySelector(v.name?.trim() ? '[name="phone"]' : '[name="name"]')?.focus();
    return null;
  }
  return v;
}

boot("cart", async () => {
  const root = document.getElementById("page-root");
  render();
  document.addEventListener("ovisfix:cartchange", render);
  document.addEventListener("ovisfix:languagechange", render);
  root.addEventListener("click", async (e) => {
    const line = e.target.closest(".cart-line");
    const qd = e.target.closest("[data-qd]");
    if (qd && line) { const it = cart.read().find((i) => i.id === line.dataset.id); if (it) cart.setQty(it.id, it.qty + Number(qd.dataset.qd)); return; }
    if (e.target.closest("[data-rm]") && line) { cart.remove(line.dataset.id); return; }
    if (e.target.closest("#clear-cart")) { if (confirm(T("cart.clearConfirm"))) cart.clear(); return; }
    if (e.target.closest("#order-wa")) {
      const v = validate(root);
      if (v) window.open(waLink(buildOrderText(cart.read(), v)), "_blank", "noopener");
      return;
    }
    if (e.target.closest("#order-send") && !sending) {
      const v = validate(root);
      if (!v) return;
      const btn = e.target.closest("#order-send");
      const msg = root.querySelector("#order-msg");
      sending = true; btn.disabled = true;
      try {
        const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: v.name, phone: v.phone, subject: "New order request", message: buildOrderText(cart.read(), v) }) });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) { msg.textContent = T("cart.sent"); msg.className = "form-msg is-ok"; toast(T("cart.sent")); }
        else { msg.textContent = data.error || T("cart.sendFailed"); msg.className = "form-msg is-error"; }
      } catch (err) { msg.textContent = T("cart.sendFailed"); msg.className = "form-msg is-error"; }
      sending = false; btn.disabled = false;
    }
  });
  root.addEventListener("input", (e) => { if (e.target.closest("#order-form")) formValues(root); });
});
