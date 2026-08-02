/* ==========================================================================
   Ovi's Fix — theme.js
   Dark / light mode. Persisted to localStorage; falls back to the system
   preference on first visit. The actual attribute is set as early as
   possible by an inline script in <head> to avoid a flash of the wrong
   theme — this module just keeps the UI (toggle button) in sync afterwards.
   ========================================================================== */

const STORAGE_KEY = "ovisfix-theme";

export function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    return null;
  }
}

export function getPreferredTheme() {
  const stored = getStoredTheme();
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function setStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (err) {
    /* localStorage unavailable (private mode, etc.) — theme just won't persist */
  }
}

function updateToggleUI(theme) {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  btn.setAttribute("aria-label", label);
  btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  setStoredTheme(theme);
  updateToggleUI(theme);
}

export function initTheme() {
  // The inline head script already set data-theme before first paint;
  // just sync the toggle button state and wire up the click handler.
  const current = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
  updateToggleUI(current);

  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  }

  // Follow system changes only if the user hasn't explicitly chosen a theme.
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!getStoredTheme()) {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
  }
}
