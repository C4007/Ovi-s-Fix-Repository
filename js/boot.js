/* ==========================================================================
   Ovi's Fix — boot.js
   Starts every shop page the same way: theme, language, shared header/footer,
   announcement ticker, site appearance settings, then the shop data — and
   finally runs that page's own init function.

   Usage in a page module:
     import { boot } from "/js/boot.js";
     boot("shop", async (data) => { ... });
   ========================================================================== */

import { initTheme } from "./theme.js";
import { initLanguage } from "./language.js";
import "./i18n-shop.js"; // registers the shop strings — must load before initLanguage()
import { initMobileMenu } from "./navbar.js";
import { initNavbarScroll } from "./animations.js";
import { applySiteSettings } from "./site-settings.js";
import { renderTicker, loadTicker, loadSiteSettings } from "./render.js";
import { injectLayout, refreshStoreBits } from "./layout.js";
import { loadShop, installImageFallback } from "./shop-core.js";

export async function boot(page, init) {
  document.body.dataset.page = page;
  injectLayout(page);
  initTheme();
  initLanguage();
  installImageFallback();
  initMobileMenu();
  initNavbarScroll();

  const [ticker, settings] = await Promise.all([loadTicker(), loadSiteSettings()]);
  applySiteSettings(settings);
  renderTicker(ticker);
  document.addEventListener("ovisfix:languagechange", () => renderTicker(ticker));

  const data = await loadShop();
  refreshStoreBits();
  if (init) await init(data);
}
