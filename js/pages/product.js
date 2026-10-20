/* Ovi's Fix — /product?id=... : one product, its specs and related items. */
import { boot } from "/js/boot.js";
import { T, loc, esc, money, shop, getProduct, setPageMeta, priceInfo, priceText, mediaHTML, stockLabel, subLabel, catLabel, subUrl, catUrl, addToCart, waLink } from "/js/shop-core.js";
import { catOfSub, STOCK } from "/js/catalog-schema.js";
import { icon } from "/js/icons.js";
import { allSpecs, productStrip, wireAddButtons, stockPill } from "/js/shop-ui.js";
import { pageHeader } from "/js/blocks.js";

const id = new URLSearchParams(location.search).get("id") || "";
let qty = 1;

function render() {
  const root = document.getElementById("page-root");
  const p = getProduct(id);
  if (!p) {
    setPageMeta(T("product.notFound"));
    root.innerHTML = `${pageHeader({ crumbs: [{ href: "/shop", label: T("nav.shop") }, { label: T("product.notFound") }], title: T("product.notFound") })}
      <section class="section-tight"><div class="container"><div class="empty"><div class="empty-ic">${icon("search")}</div><h3>${esc(T("product.notFoundHint"))}</h3><a class="btn btn-primary btn-sm" href="/shop">${esc(T("product.backToShop"))}</a></div></div></section>`;
    return;
  }
  const info = priceInfo(p);
  const cat = catOfSub(p.sub);
  const specs = allSpecs(p);
  const related = shop().products.filter((x) => x.sub === p.sub && x.id !== p.id && x.stock !== "out").sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price)).slice(0, 4);
  const canBuy = p.stock === "in" || p.stock === "pre";
  setPageMeta(p.name, `${p.name} — ${priceText(info.price)} · Ovi's Fix`);
  const waText = `Hi Ovi's Fix, I'm interested in "${p.name}" (${priceText(info.price)}). Is it available? ${location.href}`;
  document.getElementById("ld-json")?.remove();
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.id = "ld-json";
  ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: p.name, brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined, offers: { "@type": "Offer", priceCurrency: "BDT", price: info.price, availability: p.stock === "in" ? "https://schema.org/InStock" : p.stock === "pre" ? "https://schema.org/PreOrder" : "https://schema.org/OutOfStock" } });
  document.head.appendChild(ld);

  root.innerHTML = `
    ${pageHeader({ crumbs: [{ href: "/shop", label: T("nav.shop") }, { href: catUrl(cat), label: catLabel(cat) }, { href: subUrl(p.sub), label: subLabel(p.sub) }, { label: p.name }], title: "" })}
    <section class="section-tight"><div class="container">
      <div class="pdp">
        <div class="pdp-media">${mediaHTML(p)}${info.onSale ? `<span class="tag-sale">−${info.pct}%</span>` : ""}</div>
        <div class="pdp-info">
          <p class="pdp-brand">${esc(p.brand)} · ${esc(subLabel(p.sub))}</p>
          <h1>${esc(p.name)}</h1>
          <div class="pdp-stock">${stockPill(p)}${p.stock === "pre" ? `<small>${esc(T("product.preorderHint"))}</small>` : ""}</div>
          <div class="pdp-price"><strong>${esc(priceText(info.price))}</strong>${info.onSale ? `<s>${money(info.regular)}</s><span class="save">${esc(T("product.save", { amount: money(info.regular - info.price) }))}</span>` : ""}</div>
          ${info.offer ? `<p class="pdp-offer">${icon("percent")}${esc(loc(info.offer.title))}</p>` : ""}
          ${p.desc ? `<p class="pdp-desc">${esc(p.desc)}</p>` : ""}
          <div class="pdp-buy">
            <div class="qty" role="group" aria-label="${esc(T("cart.qty"))}"><button type="button" data-q="-1" aria-label="−">${icon("minus")}</button><output id="qty">${qty}</output><button type="button" data-q="1" aria-label="+">${icon("plus")}</button></div>
            <button type="button" class="btn btn-primary" id="buy" ${canBuy ? "" : "disabled"}>${icon("cart")}<span>${esc(canBuy ? (p.stock === "pre" ? T("shop.preorder") : T("shop.addToCart")) : stockLabel(p.stock))}</span></button>
            <a class="btn btn-secondary" target="_blank" rel="noopener" href="${esc(waLink(waText))}">${icon("whatsapp")}<span>${esc(T("product.askAbout"))}</span></a>
          </div>
          <p class="pdp-note">${icon("info")}${esc(loc(shop().store.priceNote))}</p>
        </div>
      </div>
      ${specs.length ? `<h2 class="block-title">${esc(T("product.specs"))}</h2><table class="spec-table"><tbody>${specs.map((s) => `<tr><th>${esc(s.label)}</th><td>${esc(s.value)}</td></tr>`).join("")}</tbody></table>` : ""}
      ${related.length ? `<h2 class="block-title">${esc(T("product.related"))}</h2>${productStrip(related)}` : ""}
    </div></section>`;
}

boot("product", async () => {
  render();
  const root = document.getElementById("page-root");
  wireAddButtons(root);
  root.addEventListener("click", (e) => {
    const q = e.target.closest("[data-q]");
    if (q) { qty = Math.min(20, Math.max(1, qty + Number(q.dataset.q))); root.querySelector("#qty").textContent = qty; }
    if (e.target.closest("#buy")) addToCart(id, qty);
  });
  document.addEventListener("ovisfix:languagechange", render);
});
