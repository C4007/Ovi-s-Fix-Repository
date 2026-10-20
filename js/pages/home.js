/* Ovi's Fix — /home : the landing page. Sends visitors to the Shop or the Service side. */
import { boot } from "/js/boot.js";
import { T, loc, esc, money, shop, setPageMeta, priceInfo, buildPrice, buildParts, shortName } from "/js/shop-core.js";
import { CATEGORIES, BUILDER_ROWS } from "/js/catalog-schema.js";
import { icon } from "/js/icons.js";
import { productCard, wireAddButtons } from "/js/shop-ui.js";
import { sectionHead, categoryTile, promiseTicket, builderCta, buildCard, wireBuildCards, offerCard, liveOffers, discountedProducts, balanceChip } from "/js/blocks.js";
import { selectionFromParts, estimateWatts } from "/js/builder-logic.js";
import { loadServices } from "/js/render.js";

let services = [];

function sheetHTML(b) {
  const { byId } = shop();
  const sel = selectionFromParts(b.parts, byId);
  const price = buildPrice(b);
  const watts = estimateWatts(sel, byId);
  const bal = balanceChip(sel, byId);
  const rows = BUILDER_ROWS.filter((r) => sel[r.key].length).map((r) => {
    const it = sel[r.key][0];
    const p = byId.get(it.id);
    return `<li><span>${icon(r.icon)}${esc(loc(r.label))}</span><em>${esc(shortName(p.name))}</em><b>${money(priceInfo(p).price * it.qty)}</b></li>`;
  }).join("");
  return `<div class="sheet" aria-label="${esc(T("home.sheetLabel"))}">
    <div class="sheet-head"><span>${esc(T("home.sheetTitle"))}</span><strong>${esc(loc(b.name))}</strong></div>
    <ul class="sheet-rows">${rows}</ul>
    <div class="sheet-foot">
      <div><small>${esc(T("builder.serviceCharge"))}</small><b class="free">৳0</b></div>
      <div><small>${esc(T("builder.estWattage"))}</small><b>${watts.total} W</b></div>
      <div class="sheet-total"><small>${esc(T("builder.total"))}</small><b>${money(price.price)}</b></div>
    </div>
    ${bal ? `<p class="sheet-bal tone-${bal.tone}">${icon("scale")}${esc(bal.text)}</p>` : ""}
    <a class="sheet-link" href="/builds">${esc(T("home.seeBuilds"))}${icon("chevron")}</a>
  </div>`;
}

function render() {
  const data = shop();
  const store = data.store;
  const builds = data.builds.filter((b) => b.active !== false);
  const feature = builds.find((b) => b.useCase === "gaming") || builds[0];
  const counts = {};
  for (const p of data.products) { const c = Object.keys(CATEGORIES).find((k) => CATEGORIES[k].subs.includes(p.sub)); counts[c] = (counts[c] || 0) + 1; }
  const offers = liveOffers();
  const deals = discountedProducts(4);
  const svc = ["diagnostic-report", "laptop-maintenance", "driver-installation", "system-performance-upgrade"]
    .map((id) => services.find((s) => s.id === id)).filter(Boolean);

  document.getElementById("page-root").innerHTML = `
  <section class="hero-home">
    <div class="container hero-home-grid">
      <div class="hero-copy">
        <h1>${esc(loc(store.heroTitle))}</h1>
        <p class="lead">${esc(loc(store.heroSub))}</p>
        <div class="doors">
          <a class="door door-shop" href="/shop"><span class="door-ic">${icon("store")}</span><span class="door-txt"><strong>${esc(T("home.doorShop"))}</strong><small>${esc(T("home.doorShopSub"))}</small></span>${icon("chevron")}</a>
          <a class="door door-service" href="/service"><span class="door-ic">${icon("wrench")}</span><span class="door-txt"><strong>${esc(T("home.doorService"))}</strong><small>${esc(T("home.doorServiceSub"))}</small></span>${icon("chevron")}</a>
        </div>
        ${promiseTicket(store)}
      </div>
      ${feature ? `<div class="hero-sheet">${sheetHTML(feature)}</div>` : ""}
    </div>
  </section>

  <section class="section"><div class="container">
    ${sectionHead(T("home.categoriesTitle"), "/shop", T("shop.viewAll"))}
    <div class="cat-grid">${Object.keys(CATEGORIES).filter((c) => counts[c]).map((c) => categoryTile(c, counts[c])).join("")}</div>
  </div></section>

  ${builderCta()}

  ${builds.length ? `<section class="section"><div class="container">
    ${sectionHead(T("home.buildsTitle"), "/builds", T("home.seeBuilds"))}
    <p class="lead narrow">${esc(T("home.buildsLead"))}</p>
    <div class="bgrid" id="home-builds">${builds.slice(0, 3).map((b, i) => buildCard(b, i)).join("")}</div>
  </div></section>` : ""}

  ${offers.length || deals.length ? `<section class="section section-tint"><div class="container">
    ${sectionHead(T("home.offersTitle"), "/offers", T("shop.viewAll"))}
    ${offers.length ? `<div class="offer-grid">${offers.slice(0, 3).map(offerCard).join("")}</div>` : ""}
    ${deals.length ? `<div class="pgrid pgrid-4" id="home-deals">${deals.map((p) => productCard(p)).join("")}</div>` : ""}
  </div></section>` : ""}

  <section class="section"><div class="container">
    ${sectionHead(T("home.servicesTitle"), "/service", T("home.allServices"))}
    <p class="lead narrow">${esc(T("home.servicesLead"))}</p>
    <div class="svc-grid">${svc.map((s) => `<a class="svc-tile" href="/service#services"><span class="cat-ic">${icon(s.icon || "wrench")}</span><strong>${esc(loc(s.title))}</strong><span class="svc-price">${s.free ? esc(T("home.free")) : esc(T("home.fromPrice", { price: money(s.price) }))}</span></a>`).join("")}</div>
  </div></section>

  <section class="section section-tint"><div class="container">
    <h2 class="center">${esc(T("home.stepsTitle"))}</h2>
    <ol class="steps">
      <li><b>1</b><div><strong>${esc(T("home.step1"))}</strong><p>${esc(T("home.step1Body"))}</p></div></li>
      <li><b>2</b><div><strong>${esc(T("home.step2"))}</strong><p>${esc(T("home.step2Body"))}</p></div></li>
      <li><b>3</b><div><strong>${esc(T("home.step3"))}</strong><p>${esc(T("home.step3Body"))}</p></div></li>
    </ol>
  </div></section>

  <section class="section"><div class="container"><div class="contact-band">
    <div><h2>${esc(T("home.contactTitle"))}</h2><p>${esc(T("home.contactLead"))}</p></div>
    <div class="contact-actions">
      <a class="btn btn-primary" id="home-wa" target="_blank" rel="noopener">${icon("whatsapp")}${esc(T("shop.askExpert"))}</a>
      ${store.phone ? `<a class="btn btn-secondary" href="tel:${esc(store.phone.replace(/[^\d+]/g, ""))}">${icon("phone")}${esc(store.phone)}</a>` : ""}
    </div>
    ${loc(store.address) ? `<p class="contact-addr">${icon("pin")}${esc(loc(store.address))}</p>` : ""}
  </div></div></section>`;
  const wa = document.getElementById("wa-float");
  const homeWa = document.getElementById("home-wa");
  if (wa && homeWa) homeWa.href = wa.href;
}

boot("home", async () => {
  setPageMeta(T("home.metaTitle"), T("home.metaDesc"));
  try { services = await loadServices(); } catch (err) { services = []; }
  render();
  const root = document.getElementById("page-root");
  wireBuildCards(root);
  wireAddButtons(root);
  document.addEventListener("ovisfix:languagechange", () => { setPageMeta(T("home.metaTitle"), T("home.metaDesc")); render(); });
});
