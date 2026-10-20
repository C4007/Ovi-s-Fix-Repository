/* Ovi's Fix — admin-shop.js: starts the shop panels of the admin page once the owner is logged in. */
import "./i18n-shop.js";
import { loadState } from "./admin/core.js";
import { initProducts } from "./admin/products.js";
import { initBuilds, initOffers } from "./admin/builds-offers.js";
import { initOverview, initStore } from "./admin/store.js";
import { installImageFallback } from "./shop-core.js";

let started = false;
async function start() {
  if (started) return;
  started = true;
  installImageFallback();
  initOverview(); initProducts(); initBuilds(); initOffers(); initStore();
  await loadState();
}
document.addEventListener("ovisfix:admin-ready", start);
if (window.__ovisAdminReady) start();
