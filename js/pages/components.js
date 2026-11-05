/* Ovi's Fix — /components : every product we stock, as a searchable, printable price list. */
import { boot } from "/js/boot.js";
import { T, esc, shop, setPageMeta, money, priceInfo, loc, toast } from "/js/shop-core.js";
import { SUBS } from "/js/catalog-schema.js";
import { icon } from "/js/icons.js";
import { mountListing } from "/js/shop-ui.js";
import { pageHeader } from "/js/blocks.js";

function headHTML() {
  const actions = `<button type="button" class="btn btn-secondary btn-sm" id="print-list">${icon("print")}<span>${esc(T("components.print"))}</span></button>
    <button type="button" class="btn btn-secondary btn-sm" id="copy-list">${icon("copy")}<span>${esc(T("components.copy"))}</span></button>`;
  return pageHeader({ crumbs: [{ label: T("nav.priceList") }], title: T("components.title"), lead: T("components.lead"), actions });
}

boot("components", async () => {
  const root = document.getElementById("page-root");
  root.innerHTML = `<div id="page-head"></div><section class="section-tight"><div class="container"><p class="price-note">${icon("info")}<span id="price-note"></span></p><div id="listing-root"></div></div></section>`;
  const head = document.getElementById("page-head");
  const paint = () => {
    head.innerHTML = headHTML();
    setPageMeta(T("components.title"), T("components.lead"));
    document.getElementById("price-note").textContent = loc(shop().store.priceNote);
  };
  paint();
  mountListing(document.getElementById("listing-root"), { subs: Object.keys(SUBS), catTabs: true, listView: "table", defaultView: "list", viewKey: "pricelist", pageSize: 40 });
  document.addEventListener("ovisfix:languagechange", paint);

  document.addEventListener("click", async (e) => {
    // Print: the browser's print dialog also offers "Save as PDF".
    if (e.target.closest("#print-list")) window.print();
    if (e.target.closest("#copy-list")) {
      const rows = [...document.querySelectorAll(".ptable tbody tr")]
        .map((tr) => { const p = shop().byId.get(tr.dataset.id); return p ? `${p.name} — ${money(priceInfo(p).price)}` : ""; })
        .filter(Boolean);
      try { await navigator.clipboard.writeText(rows.join("\n")); toast(T("components.copied", { n: rows.length })); } catch (err) { /* clipboard blocked */ }
    }
  });
});
