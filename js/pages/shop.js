/* Ovi's Fix — /shop, /shop/<category>, /shop/<category>/<sub-category> */
import { boot } from "/js/boot.js";
import { T, loc, esc, shop, setPageMeta, catLabel, subLabel, catUrl } from "/js/shop-core.js";
import { CATEGORIES, SUBS } from "/js/catalog-schema.js";
import { icon } from "/js/icons.js";
import { mountListing, productStrip, wireAddButtons } from "/js/shop-ui.js";
import { pageHeader, sectionHead, categoryTile, promiseTicket, builderCta, buildCard, wireBuildCards, offerCard, liveOffers, discountedProducts } from "/js/blocks.js";

const CAT = document.body.dataset.cat || "";

/* ----------------------------------------------------------------- hub (/shop) */
function renderHub() {
  const data = shop();
  const counts = {};
  for (const p of data.products) { const c = Object.keys(CATEGORIES).find((k) => CATEGORIES[k].subs.includes(p.sub)); counts[c] = (counts[c] || 0) + 1; }
  const builds = data.builds.filter((b) => b.active !== false);
  const offers = liveOffers();
  const deals = discountedProducts(4);
  const popular = data.products.filter((p) => p.featured && p.stock !== "out").slice(0, 8);
  const search = `<form class="hub-search" action="/components" method="get" role="search">${icon("search")}<input type="search" name="q" placeholder="${esc(T("shop.searchAll"))}" aria-label="${esc(T("shop.search"))}"><button class="btn btn-primary btn-sm" type="submit">${esc(T("shop.search"))}</button></form>`;
  document.getElementById("page-root").innerHTML = `
    ${pageHeader({ crumbs: [{ label: T("nav.shop") }], title: T("shop.title"), lead: T("shop.lead"), actions: search })}
    <section class="section-tight"><div class="container">
      ${promiseTicket(data.store)}
      <div class="cat-grid cat-grid-lg">${Object.keys(CATEGORIES).filter((c) => counts[c]).map((c) => categoryTile(c, counts[c])).join("")}</div>
    </div></section>
    ${offers.length || deals.length ? `<section class="section section-tint"><div class="container">
      ${sectionHead(T("home.offersTitle"), "/offers", T("shop.viewAll"))}
      ${offers.length ? `<div class="offer-grid">${offers.slice(0, 3).map(offerCard).join("")}</div>` : ""}
      ${deals.length ? productStrip(deals) : ""}
    </div></section>` : ""}
    ${builds.length ? `<section class="section"><div class="container">
      ${sectionHead(T("home.buildsTitle"), "/builds", T("home.seeBuilds"))}
      <div class="bgrid">${builds.slice(0, 3).map((b, i) => buildCard(b, i)).join("")}</div>
    </div></section>` : ""}
    ${popular.length ? `<section class="section"><div class="container">
      ${sectionHead(T("shop.popular"), "/components", T("shop.viewAll"))}
      ${productStrip(popular)}
    </div></section>` : ""}
    ${builderCta()}`;
}

/* ------------------------------------------------------- category / sub-category */
function headHTML(state) {
  const sub = state?.sub || "";
  const crumbs = [{ href: "/shop", label: T("nav.shop") }];
  let title;
  if (sub) { crumbs.push({ href: catUrl(CAT), label: catLabel(CAT) }, { label: subLabel(sub) }); title = subLabel(sub); }
  else { crumbs.push({ label: catLabel(CAT) }); title = catLabel(CAT); }
  const lead = sub ? "" : loc(CATEGORIES[CAT].blurb);
  return pageHeader({ crumbs, title, lead });
}

function renderCategory() {
  const root = document.getElementById("page-root");
  root.innerHTML = `<div id="page-head"></div><section class="section-tight"><div class="container" id="listing-root"></div></section>`;
  const head = document.getElementById("page-head");
  let last = null;
  const paint = () => {
    head.innerHTML = headHTML(last);
    const sub = last?.sub;
    setPageMeta(sub ? subLabel(sub) : catLabel(CAT), sub ? `${subLabel(sub)} — ${catLabel(CAT)} · Ovi's Fix` : loc(CATEGORIES[CAT].blurb));
  };
  const listing = mountListing(document.getElementById("listing-root"), {
    cat: CAT, subs: CATEGORIES[CAT].subs, pathMode: true, pageSize: 24,
    onRender: ({ state }) => { const changed = last?.sub !== state.sub || !last; last = { sub: state.sub }; if (changed) paint(); },
  });
  last = last || { sub: listing.state.sub };
  paint();
  document.addEventListener("ovisfix:languagechange", paint);
}

boot("shop", async () => {
  const root = document.getElementById("page-root");
  if (!CAT || !CATEGORIES[CAT]) {
    setPageMeta(T("shop.title"), T("shop.lead"));
    renderHub();
    wireBuildCards(root);
    wireAddButtons(root);
    document.addEventListener("ovisfix:languagechange", () => { setPageMeta(T("shop.title"), T("shop.lead")); renderHub(); });
  } else {
    renderCategory();
  }
});
