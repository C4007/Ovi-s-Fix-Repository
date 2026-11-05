/* Ovi's Fix — /builds : budget-friendly pre-configured PCs. */
import { boot } from "/js/boot.js";
import { T, esc, shop, setPageMeta } from "/js/shop-core.js";
import { icon } from "/js/icons.js";
import { pageHeader, buildCard, wireBuildCards, promiseTicket, builderCta } from "/js/blocks.js";

function render() {
  const data = shop();
  const builds = data.builds.filter((b) => b.active !== false);
  document.getElementById("page-root").innerHTML = `
    ${pageHeader({ crumbs: [{ label: T("nav.builds") }], title: T("builds.title"), lead: T("builds.lead") })}
    <section class="section-tight"><div class="container">
      ${promiseTicket(data.store)}
      ${builds.length
        ? `<div class="bgrid bgrid-lg">${builds.map((b, i) => buildCard(b, i)).join("")}</div>`
        : `<div class="empty"><div class="empty-ic">${icon("box")}</div><h3>${esc(T("builds.none"))}</h3><p>${esc(T("builds.noneHint"))}</p><a class="btn btn-primary btn-sm" href="/pc-builder">${esc(T("home.openBuilder"))}</a></div>`}
      <p class="price-note">${icon("info")}<span>${esc(T("builds.note"))}</span></p>
    </div></section>
    ${builderCta()}`;
}

boot("builds", async () => {
  setPageMeta(T("builds.title"), T("builds.lead"));
  render();
  wireBuildCards(document.getElementById("page-root"));
  document.addEventListener("ovisfix:languagechange", () => { setPageMeta(T("builds.title"), T("builds.lead")); render(); });
});
