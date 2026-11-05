/* ==========================================================================
   Ovi's Fix — main.js
   Entry point for /service and /terms (the original site pages). The shop pages
   use boot.js instead. Wires up the shared header/footer, theme, language,
   dynamic rendering, navbar and the contact form. Every init function checks
   for its own DOM targets, so it's safe that not every page has every section.
   ========================================================================== */

import { initTheme } from "./theme.js";
import { initLanguage } from "./language.js";
import "./i18n-shop.js"; // shop strings (also used by the shared header and footer)
import { renderAll } from "./render.js";
import { initMobileMenu } from "./navbar.js";
import { initContactForm } from "./contact-form.js";
import { observeReveal, initNavbarScroll } from "./animations.js";
import { injectLayout, refreshStoreBits } from "./layout.js";
import { loadShop, installImageFallback, setPageMeta, T } from "./shop-core.js";
import { promiseTicket } from "./blocks.js";

const PAGE = document.body.dataset.page || "service";

function paintShopBits(store) {
  // The "service charge is free" ticket on the service page
  const slot = document.getElementById("service-promise");
  if (slot && store) slot.innerHTML = promiseTicket(store);
}

function setTitle() {
  if (PAGE === "terms") setPageMeta(T("terms.title"));
}

async function init() {
  injectLayout(PAGE); // header, footer and WhatsApp button must exist before the modules below look for them
  initTheme();
  initLanguage(); // applies static data-i18n text for the stored/default language
  installImageFallback();
  setTitle();
  await renderAll(); // builds services (fetched live, falls back to bundled defaults), comparison, why-us, FAQ, terms
  initMobileMenu();
  initNavbarScroll();
  initContactForm();

  // Catch any static (non data-driven) .reveal elements already in the HTML.
  observeReveal(document.querySelectorAll(".reveal, .reveal-scale"));

  loadShop().then((data) => { refreshStoreBits(); paintShopBits(data.store); });

  // Language toggle re-renders the dynamic sections in the new language.
  document.addEventListener("ovisfix:languagechange", async () => {
    await renderAll();
    observeReveal(document.querySelectorAll(".reveal, .reveal-scale"));
    setTitle();
    loadShop().then((data) => paintShopBits(data.store));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
