/* Ovi's Fix — 404 page */
import { boot } from "/js/boot.js";
import { T, esc, setPageMeta } from "/js/shop-core.js";
import { icon } from "/js/icons.js";

function render() {
  document.getElementById("page-root").innerHTML = `<section class="section-tight"><div class="container"><div class="empty">
    <div class="empty-ic">${icon("search")}</div><h3>${esc(T("notfound.title"))}</h3><p>${esc(T("notfound.hint"))}</p>
    <div class="empty-actions"><a class="btn btn-primary btn-sm" href="/home">${esc(T("notfound.home"))}</a><a class="btn btn-secondary btn-sm" href="/shop">${esc(T("nav.shop"))}</a><a class="btn btn-secondary btn-sm" href="/service">${esc(T("nav.service"))}</a></div></div></div></section>`;
}
boot("notfound", async () => { setPageMeta(T("notfound.title")); render(); document.addEventListener("ovisfix:languagechange", () => { setPageMeta(T("notfound.title")); render(); }); });
