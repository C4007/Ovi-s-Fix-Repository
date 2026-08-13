/* ==========================================================================
   Ovi's Fix — language.js
   EN / BN toggle. Static chrome text is marked up with data-i18n="a.b.c"
   (dot-path into translations.js) and swapped directly. Dynamic, data-driven
   sections (services, comparison, FAQ, why-us, terms) listen for the
   "ovisfix:languagechange" event and re-render themselves — see render.js.
   ========================================================================== */

import { translations } from "./translations.js";

const STORAGE_KEY = "ovisfix-lang";

function resolvePath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function getCurrentLanguage() {
  return document.documentElement.getAttribute("data-lang") || "en";
}

function getStoredLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    return null;
  }
}

function setStoredLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (err) {
    /* ignore — language just won't persist across visits */
  }
}

function applyStaticText(lang) {
  const dict = translations[lang] || translations.en;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = resolvePath(dict, el.getAttribute("data-i18n"));
    if (typeof value === "string") el.textContent = value;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const value = resolvePath(dict, el.getAttribute("data-i18n-placeholder"));
    if (typeof value === "string") el.setAttribute("placeholder", value);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const value = resolvePath(dict, el.getAttribute("data-i18n-aria"));
    if (typeof value === "string") el.setAttribute("aria-label", value);
  });

  if (dict.meta) {
    if (dict.meta.title) document.title = dict.meta.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict.meta.description) metaDesc.setAttribute("content", dict.meta.description);
  }
}

function updateToggleUI(lang) {
  const btn = document.getElementById("lang-toggle");
  if (!btn) return;
  // Flag visibility is handled by CSS via [data-lang] — just keep the
  // accessible label in sync.
  btn.setAttribute("aria-label", lang === "en" ? "Switch to Bangla" : "Switch to English");
}

export function setLanguage(lang) {
  document.documentElement.setAttribute("data-lang", lang);
  document.documentElement.setAttribute("lang", lang === "bn" ? "bn" : "en");
  setStoredLanguage(lang);
  applyStaticText(lang);
  updateToggleUI(lang);
  document.dispatchEvent(new CustomEvent("ovisfix:languagechange", { detail: { lang } }));
}

export function initLanguage() {
  const stored = getStoredLanguage();
  const initial = stored === "bn" ? "bn" : "en";
  setLanguage(initial);

  const btn = document.getElementById("lang-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const next = getCurrentLanguage() === "en" ? "bn" : "en";
      setLanguage(next);
    });
  }
}
