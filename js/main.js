/* ==========================================================================
   Ovi's Fix — main.js
   Entry point (loaded as a module from both index.html and terms.html).
   Wires up theme, language, dynamic rendering, navbar, animations, and the
   contact form. Every init function below checks for its own DOM targets,
   so it's safe that not every page has every section.
   ========================================================================== */

import { initTheme } from "./theme.js";
import { initLanguage } from "./language.js";
import { renderAll } from "./render.js";
import { initMobileMenu } from "./navbar.js";
import { initContactForm } from "./contact-form.js";
import { observeReveal, initMouseParallax, initLoadingScreen, initNavbarScroll } from "./animations.js";

function setCopyrightYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

function init() {
  setCopyrightYear();
  initLoadingScreen();
  initTheme();
  initLanguage(); // applies static data-i18n text for the stored/default language
  renderAll(); // builds services, comparison, why-us, FAQ, terms (whichever exist on this page)
  initMobileMenu();
  initNavbarScroll();
  initMouseParallax();
  initContactForm();

  // Catch any static (non data-driven) .reveal elements already in the HTML —
  // safe to call even though renderAll()'s pieces already observed themselves.
  observeReveal(document.querySelectorAll(".reveal, .reveal-scale"));

  // Language toggle re-renders the dynamic sections in the new language.
  document.addEventListener("ovisfix:languagechange", () => {
    renderAll();
    observeReveal(document.querySelectorAll(".reveal, .reveal-scale"));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
