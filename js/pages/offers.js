/* Ovi's Fix — /offers : live offers, perks and every discounted product. */
import { boot } from "/js/boot.js";
import { T, esc, loc, shop, setPageMeta } from "/js/shop-core.js";
import { SUBS } from "/js/catalog-schema.js";
import { icon } from "/js/icons.js";
import { mountListing } from "/js/shop-ui.js";
import { pageHeader, offerCard, liveOffers, discountedProducts } from "/js/blocks.js";

function headHTML() {
  return pageHeader({ crumbs: [{ label: T("nav.offers") }], title: T("offers.title"), lead: T("offers.lead") });
}

boot("offers", async () => {
  const root = document.getElementById("page-root");
  const focus = new URLSearchParams(location.search).get("offer");
  const paint = () => {
    document.getElementById("page-head").innerHTML = headHTML();
    const offers = liveOffers();
    document.getElementById("offer-cards").innerHTML = offers.length
      ? `<div class="offer-grid">${offers.map(offerCard).join("")}</div>`
      : `<div class="empty"><div class="empty-ic">${icon("percent")}</div><h3>${esc(T("offers.none"))}</h3><p>${esc(T("offers.noneHint"))}</p></div>`;
    setPageMeta(T("offers.title"), T("offers.lead"));
  };
  root.innerHTML = `<div id="page-head"></div>
    <section class="section-tight"><div class="container">
      <div id="offer-cards"></div>
      <h2 class="block-title" id="deals-title"></h2>
      <div id="listing-root"></div>
    </div></section>`;
  paint();
  const title = document.getElementById("deals-title");
  const paintTitle = () => {
    const o = focus ? shop().offers.find((x) => x.id === focus) : null;
    title.textContent = o ? loc(o.title) : T("offers.productsTitle");
  };
  paintTitle();
  document.addEventListener("ovisfix:languagechange", () => { paint(); paintTitle(); });
  if (!discountedProducts(1).length) { title.hidden = true; document.getElementById("listing-root").hidden = true; return; }
  mountListing(document.getElementById("listing-root"), { subs: Object.keys(SUBS), catTabs: true, onlyOnSale: true, defaultSort: "discount", pageSize: 24 });
});
