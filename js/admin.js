/* ==========================================================================
   Ovi's Fix — admin.js
   Login → dashboard → edit services in memory → Save All Changes writes the
   whole array back via POST /api/admin/services. Read access (GET
   /api/services) is public — only writing requires the session cookie.
   ========================================================================== */

import { initTheme } from "./theme.js";
import { initLoadingScreen } from "./animations.js";
import { defaultServices, defaultTicker, defaultSiteSettings } from "./data.js";
import { applySiteSettings } from "./site-settings.js";

let currentServices = [];
let currentTicker = [];
let currentSettings = null;
let appearanceMode = "light"; // which theme's colors/glass fields are showing
let heroThemeMode = "light"; // which theme's hero banner is showing in the Hero panel
let heroImages = { light: null, dark: null }; // saved data URLs, null = falls back to bundled default
let pendingHeroImage = null; // { dataUrl, width, height } once a valid file is chosen

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function setByPath(obj, path, value) {
  const keys = path.split(".");
  let target = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof target[key] !== "object" || target[key] === null) target[key] = {};
    target = target[key];
  }
  target[keys[keys.length - 1]] = value;
}

function showStatus(el, type, message) {
  el.textContent = message;
  el.classList.remove("is-success", "is-error");
  el.classList.add("is-visible", type === "success" ? "is-success" : "is-error");
}

function clearStatus(el) {
  el.classList.remove("is-visible", "is-success", "is-error");
  el.textContent = "";
}

/* ---------------------------------------------------------------------------
   View switching
   --------------------------------------------------------------------------- */
function showLoginView() {
  $("admin-login-view").style.display = "";
  $("admin-dashboard-view").style.display = "none";
  $("admin-logout-btn").style.display = "none";
}

function showDashboardView() {
  $("admin-login-view").style.display = "none";
  $("admin-dashboard-view").style.display = "";
  $("admin-logout-btn").style.display = "";
}

/* ---------------------------------------------------------------------------
   Hero ticker lines (simpler editor: just en/bn text + reordering)
   --------------------------------------------------------------------------- */
function tickerLineMarkup(line, index, total) {
  return `
    <div class="admin-service-card glass" data-index="${index}">
      <div class="admin-service-summary">
        <div class="admin-service-summary-info">
          <strong class="admin-service-summary-title">${escapeHtml(line.en || "(empty line)")}</strong>
        </div>
        <div class="admin-service-summary-actions">
          <button type="button" class="btn-sm ticker-move-up" ${index === 0 ? "disabled" : ""} aria-label="Move up">&uarr;</button>
          <button type="button" class="btn-sm ticker-move-down" ${index === total - 1 ? "disabled" : ""} aria-label="Move down">&darr;</button>
          <button type="button" class="btn-sm danger ticker-delete-btn">Delete</button>
        </div>
      </div>
      <div class="admin-service-form">
        <div class="admin-form-grid">
          <div class="form-group full-width">
            <label class="form-label">English</label>
            <input type="text" class="form-input ticker-field" data-field="en" value="${escapeHtml(line.en || "")}">
          </div>
          <div class="form-group full-width">
            <label class="form-label">Bangla</label>
            <input type="text" class="form-input ticker-field" data-field="bn" value="${escapeHtml(line.bn || "")}">
          </div>
        </div>
      </div>
    </div>`;
}

function renderTickerList(usingDefaults) {
  const container = $("ticker-lines-list");
  if (!currentTicker.length) {
    container.innerHTML = '<div class="admin-empty-state glass">No ticker lines yet — click "+ Add Line" to create one.</div>';
    return;
  }
  const notice = usingDefaults
    ? '<div class="admin-defaults-notice glass">Showing the text currently live on the site (nothing\'s been saved to the database yet). Edit below, then click <strong>Save Ticker</strong> to make it official.</div>'
    : "";
  container.innerHTML = notice + currentTicker.map((line, i) => tickerLineMarkup(line, i, currentTicker.length)).join("");
}

function initTickerListEvents() {
  const container = $("ticker-lines-list");

  container.addEventListener("click", (e) => {
    const card = e.target.closest(".admin-service-card");
    if (!card) return;
    const index = Number(card.dataset.index);

    if (e.target.closest(".ticker-delete-btn")) {
      currentTicker.splice(index, 1);
      renderTickerList();
    }
    if (e.target.closest(".ticker-move-up") && index > 0) {
      [currentTicker[index - 1], currentTicker[index]] = [currentTicker[index], currentTicker[index - 1]];
      renderTickerList();
    }
    if (e.target.closest(".ticker-move-down") && index < currentTicker.length - 1) {
      [currentTicker[index + 1], currentTicker[index]] = [currentTicker[index], currentTicker[index + 1]];
      renderTickerList();
    }
  });

  container.addEventListener("input", (e) => {
    const field = e.target.dataset.field;
    if (!field || !e.target.classList.contains("ticker-field")) return;
    const card = e.target.closest(".admin-service-card");
    const index = Number(card.dataset.index);
    currentTicker[index][field] = e.target.value;

    if (field === "en") {
      card.querySelector(".admin-service-summary-title").textContent = e.target.value || "(empty line)";
    }
  });
}

function handleAddTickerLine() {
  currentTicker.push({ en: "", bn: "" });
  renderTickerList();
}

async function handleSaveTicker() {
  const statusEl = $("ticker-save-status");
  const saveBtn = $("ticker-save-btn");
  clearStatus(statusEl);

  saveBtn.disabled = true;
  const originalLabel = saveBtn.textContent;
  saveBtn.textContent = "Saving...";

  try {
    const res = await fetch("/api/admin/ticker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: currentTicker }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showStatus(statusEl, "error", data.error || "Could not save the ticker.");
      return;
    }
    showStatus(statusEl, "success", "Saved! The homepage ticker will show this on next load.");
  } catch (err) {
    showStatus(statusEl, "error", "Network error — could not reach the server.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalLabel;
  }
}

async function loadTickerIntoDashboard() {
  let usingDefaults = false;
  try {
    const res = await fetch("/api/ticker", { cache: "no-store" });
    const data = await res.json();
    if (Array.isArray(data.lines) && data.lines.length > 0) {
      currentTicker = data.lines;
    } else {
      // Nothing saved to the database yet — pre-fill with the same bundled
      // lines the live site is currently falling back to, so the admin
      // panel isn't blank and doesn't look "empty" when the site clearly
      // has ticker text showing. Editing + Save Ticker persists these to
      // the database for real, replacing the bundled fallback.
      currentTicker = structuredClone(defaultTicker);
      usingDefaults = true;
    }
  } catch (err) {
    currentTicker = structuredClone(defaultTicker);
    usingDefaults = true;
  }
  renderTickerList(usingDefaults);
}

/* ---------------------------------------------------------------------------
   Hero banner image (strict client-side resolution validation before save)
   --------------------------------------------------------------------------- */

// Mirrors lib/validate-hero.js — duplicated here because this runs in the
// browser and can't import server-side lib/ files without a build step.
// Keep these two in sync if the requirements ever change.
const HERO_MIN_WIDTH = 1600;
const HERO_ASPECT_TARGET = 2560 / 1086;
const HERO_ASPECT_TOLERANCE = 0.15;
const HERO_MAX_DATA_URL_LENGTH = 2_800_000;

function validateHeroClientSide(dataUrl, width, height) {
  if (dataUrl.length > HERO_MAX_DATA_URL_LENGTH) {
    return "Image file is too large — please use a more compressed export (under ~2MB).";
  }
  if (width < HERO_MIN_WIDTH) {
    return `Image is too small — needs to be at least ${HERO_MIN_WIDTH}px wide (yours is ${width}px).`;
  }
  const aspect = width / height;
  if (Math.abs(aspect - HERO_ASPECT_TARGET) > HERO_ASPECT_TOLERANCE) {
    return `Image proportions are off — needs to be a wide banner shape (around ${HERO_ASPECT_TARGET.toFixed(2)}:1, like 2560×1086). Yours is ${aspect.toFixed(2)}:1.`;
  }
  return null;
}

function heroPreviewFallbackText(theme) {
  return `Using the default bundled image for ${theme} mode — no custom upload saved yet.`;
}

function handleHeroFileSelect(e) {
  const file = e.target.files[0];
  const statusEl = $("hero-status");
  clearStatus(statusEl);
  $("hero-save-btn").disabled = true;
  pendingHeroImage = null;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const error = validateHeroClientSide(dataUrl, width, height);
      if (error) {
        showStatus(statusEl, "error", error);
        return;
      }
      pendingHeroImage = { dataUrl, width, height };
      $("hero-preview-img").src = dataUrl;
      $("hero-preview-meta").textContent = `${width} × ${height}px — ready to save for ${heroThemeMode} mode`;
      $("hero-save-btn").disabled = false;
      showStatus(statusEl, "success", "Looks good — click Save to publish it.");
    };
    img.onerror = () => showStatus(statusEl, "error", "Couldn't read this file as an image.");
    img.src = dataUrl;
  };
  reader.onerror = () => showStatus(statusEl, "error", "Couldn't read this file.");
  reader.readAsDataURL(file);
}

async function handleSaveHero() {
  if (!pendingHeroImage) return;
  const statusEl = $("hero-status");
  const saveBtn = $("hero-save-btn");
  saveBtn.disabled = true;
  const originalLabel = saveBtn.textContent;
  saveBtn.textContent = "Saving...";

  try {
    const res = await fetch("/api/admin/hero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: heroThemeMode, image: pendingHeroImage }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showStatus(statusEl, "error", data.error || "Could not save the hero image.");
      saveBtn.disabled = false;
      saveBtn.textContent = originalLabel;
      return;
    }
    heroImages[heroThemeMode] = pendingHeroImage.dataUrl;
    showStatus(statusEl, "success", `Saved! The homepage will show this for ${heroThemeMode} mode on next load.`);
    pendingHeroImage = null;
    saveBtn.textContent = originalLabel;
  } catch (err) {
    showStatus(statusEl, "error", "Network error — could not reach the server.");
    saveBtn.disabled = false;
    saveBtn.textContent = originalLabel;
  }
}

function renderHeroPreviewForCurrentTheme() {
  const img = $("hero-preview-img");
  const meta = $("hero-preview-meta");
  const saved = heroImages[heroThemeMode];
  if (saved) {
    img.src = saved;
    meta.textContent = `Current ${heroThemeMode}-mode banner`;
  } else {
    img.src = "images/hero-banner.webp";
    meta.textContent = heroPreviewFallbackText(heroThemeMode);
  }
  $("hero-save-btn").disabled = true;
  pendingHeroImage = null;
  clearStatus($("hero-status"));
}

function initHeroThemeToggle() {
  document.querySelectorAll("#hero-theme-toggle .device-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      heroThemeMode = btn.dataset.heroTheme;
      document.querySelectorAll("#hero-theme-toggle .device-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderHeroPreviewForCurrentTheme();
    });
  });
}

async function loadHeroIntoDashboard() {
  try {
    const res = await fetch("/api/hero", { cache: "no-store" });
    const data = await res.json();
    heroImages.light = data.light?.dataUrl || null;
    heroImages.dark = data.dark?.dataUrl || null;
  } catch (err) {
    heroImages.light = null;
    heroImages.dark = null;
  }
  renderHeroPreviewForCurrentTheme();
}

function updateHeroPositionLabels() {
  $("hero-pos-desktop-value").textContent = `${currentSettings.heroPosition.desktop}%`;
  $("hero-pos-mobile-value").textContent = `${currentSettings.heroPosition.mobile}%`;
}

function initHeroPositionEvents() {
  $("hero-pos-desktop").addEventListener("input", (e) => {
    currentSettings.heroPosition.desktop = Number(e.target.value);
    updateHeroPositionLabels();
    applySiteSettings(currentSettings);
  });
  $("hero-pos-mobile").addEventListener("input", (e) => {
    currentSettings.heroPosition.mobile = Number(e.target.value);
    updateHeroPositionLabels();
    applySiteSettings(currentSettings);
  });
  $("hero-position-save-btn").addEventListener("click", () => saveSettingsSection("hero-position-status", "hero-position-save-btn", "Saved! Applies to both banners."));
}

/* ---------------------------------------------------------------------------
   Rendering the editable service list
   --------------------------------------------------------------------------- */
function serviceCardMarkup(service, index) {
  const title = getByPath(service, "title.en") || "(untitled)";
  const price = service.free ? "Free" : service.price !== undefined ? `৳${service.price}` : "—";
  const isNew = !!service.__isNew;

  return `
    <div class="admin-service-card glass" data-index="${index}">
      <div class="admin-service-summary">
        <div class="admin-service-summary-info">
          <strong class="admin-service-summary-title">${escapeHtml(title)}</strong>
          <span class="admin-service-summary-price">${escapeHtml(price)}</span>
          ${isNew ? '<span class="admin-service-summary-badge">New — unsaved</span>' : ""}
        </div>
        <div class="admin-service-summary-actions">
          <button type="button" class="btn-sm admin-edit-toggle">Edit</button>
          <button type="button" class="btn-sm danger admin-delete-btn">Delete</button>
        </div>
      </div>
      <div class="admin-service-form" hidden>
        <div class="admin-form-grid">
          <div class="form-group">
            <label class="form-label">ID</label>
            <input type="text" class="form-input admin-field" data-field="id" value="${escapeHtml(service.id)}" ${isNew ? "" : "readonly"}>
            ${isNew ? '<div class="admin-id-hint">Short and unique, e.g. "laptop-tuneup". Used to match this service elsewhere on the site, so avoid changing it after saving.</div>' : ""}
          </div>
          <div class="form-group">
            <label class="form-label">Image filename</label>
            <input type="text" class="form-input admin-field" data-field="image" value="${escapeHtml(service.image || "")}" placeholder="e.g. driver-installation.jpg">
          </div>
          <div class="form-group checkbox-group">
            <label><input type="checkbox" class="admin-field" data-field="free" data-type="checkbox" ${service.free ? "checked" : ""}> Free (no price)</label>
          </div>
          <div class="form-group checkbox-group">
            <label><input type="checkbox" class="admin-field" data-field="featured" data-type="checkbox" ${service.featured ? "checked" : ""}> Featured</label>
          </div>
          <div class="form-group">
            <label class="form-label">Price (BDT)</label>
            <input type="number" min="0" class="form-input admin-field" data-field="price" data-type="number" value="${service.price !== undefined ? service.price : ""}">
          </div>
          <div class="form-group">
            <label class="form-label">Unit &mdash; English</label>
            <input type="text" class="form-input admin-field" data-field="unit.en" value="${escapeHtml(getByPath(service, "unit.en") || "")}" placeholder="per service">
          </div>
          <div class="form-group">
            <label class="form-label">Unit &mdash; Bangla</label>
            <input type="text" class="form-input admin-field" data-field="unit.bn" value="${escapeHtml(getByPath(service, "unit.bn") || "")}">
          </div>
          <div class="form-group full-width">
            <label class="form-label">Title &mdash; English</label>
            <input type="text" class="form-input admin-field" data-field="title.en" value="${escapeHtml(getByPath(service, "title.en") || "")}">
          </div>
          <div class="form-group full-width">
            <label class="form-label">Title &mdash; Bangla</label>
            <input type="text" class="form-input admin-field" data-field="title.bn" value="${escapeHtml(getByPath(service, "title.bn") || "")}">
          </div>
          <div class="form-group full-width">
            <label class="form-label">Description &mdash; English</label>
            <textarea class="form-textarea admin-field" data-field="desc.en">${escapeHtml(getByPath(service, "desc.en") || "")}</textarea>
          </div>
          <div class="form-group full-width">
            <label class="form-label">Description &mdash; Bangla</label>
            <textarea class="form-textarea admin-field" data-field="desc.bn">${escapeHtml(getByPath(service, "desc.bn") || "")}</textarea>
          </div>
        </div>
      </div>
    </div>`;
}

function renderServicesList(usingDefaults) {
  const container = $("admin-services-list");
  if (!currentServices.length) {
    container.innerHTML = '<div class="admin-empty-state glass">No services yet — click "+ Add Service" to create your first one.</div>';
    return;
  }
  const notice = usingDefaults
    ? '<div class="admin-defaults-notice glass">Showing the 18 services currently live on the site (nothing\'s been saved to the database yet). Edit or remove any of them, then click <strong>Save All Changes</strong> to make it official.</div>'
    : "";
  container.innerHTML = notice + currentServices.map((s, i) => serviceCardMarkup(s, i)).join("");
}

/* ---------------------------------------------------------------------------
   Event delegation for the service list (edit toggle, delete, field edits)
   --------------------------------------------------------------------------- */
function initServicesListEvents() {
  const container = $("admin-services-list");

  container.addEventListener("click", (e) => {
    const card = e.target.closest(".admin-service-card");
    if (!card) return;
    const index = Number(card.dataset.index);

    if (e.target.closest(".admin-edit-toggle")) {
      const form = card.querySelector(".admin-service-form");
      const isHidden = form.hasAttribute("hidden");
      if (isHidden) form.removeAttribute("hidden");
      else form.setAttribute("hidden", "");
      e.target.closest(".admin-edit-toggle").textContent = isHidden ? "Collapse" : "Edit";
    }

    if (e.target.closest(".admin-delete-btn")) {
      const title = currentServices[index]?.title?.en || "this service";
      if (confirm(`Delete "${title}"? This takes effect once you click Save All Changes.`)) {
        currentServices.splice(index, 1);
        renderServicesList();
      }
    }
  });

  container.addEventListener("input", (e) => {
    const field = e.target.dataset.field;
    if (!field) return;
    const card = e.target.closest(".admin-service-card");
    const index = Number(card.dataset.index);
    const type = e.target.dataset.type;

    let value = e.target.value;
    if (type === "checkbox") value = e.target.checked;
    else if (type === "number") value = value === "" ? undefined : Number(value);

    setByPath(currentServices[index], field, value);

    // keep the summary line (title/price) in sync without a full re-render,
    // which would otherwise steal focus mid-typing
    if (field === "title.en" || field === "price" || field === "free") {
      const summaryTitle = card.querySelector(".admin-service-summary-title");
      const summaryPrice = card.querySelector(".admin-service-summary-price");
      const s = currentServices[index];
      summaryTitle.textContent = getByPath(s, "title.en") || "(untitled)";
      summaryPrice.textContent = s.free ? "Free" : s.price !== undefined ? `৳${s.price}` : "—";
    }
  });
}

/* ---------------------------------------------------------------------------
   Add / Save
   --------------------------------------------------------------------------- */
function handleAddService() {
  const newService = {
    id: "new-service-" + Math.random().toString(36).slice(2, 8),
    price: 0,
    unit: { en: "per service", bn: "প্রতি সার্ভিস" },
    title: { en: "", bn: "" },
    desc: { en: "", bn: "" },
    __isNew: true,
  };
  currentServices.unshift(newService);
  renderServicesList();
  const firstForm = $("admin-services-list").querySelector(".admin-service-form");
  if (firstForm) firstForm.removeAttribute("hidden");
  const firstToggle = $("admin-services-list").querySelector(".admin-edit-toggle");
  if (firstToggle) firstToggle.textContent = "Collapse";
}

async function handleSave() {
  const statusEl = $("admin-save-status");
  const saveBtn = $("admin-save-btn");
  clearStatus(statusEl);

  // strip the client-only __isNew flag before sending
  const payload = currentServices.map(({ __isNew, ...rest }) => rest);

  saveBtn.disabled = true;
  const originalLabel = saveBtn.textContent;
  saveBtn.textContent = "Saving...";

  try {
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ services: payload }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showStatus(statusEl, "error", data.error || "Could not save changes.");
      return;
    }
    currentServices = payload; // drop __isNew markers now that it's saved
    renderServicesList();
    showStatus(statusEl, "success", "Saved! The homepage will show these changes on next load.");
  } catch (err) {
    showStatus(statusEl, "error", "Network error — could not reach the server.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalLabel;
  }
}

/* ---------------------------------------------------------------------------
   Auth
   --------------------------------------------------------------------------- */
async function checkAuth() {
  try {
    const res = await fetch("/api/admin/check");
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function loadServicesIntoDashboard() {
  let usingDefaults = false;
  try {
    const res = await fetch("/api/services", { cache: "no-store" });
    const data = await res.json();
    if (Array.isArray(data.services) && data.services.length > 0) {
      currentServices = data.services;
    } else {
      // Same reasoning as loadTickerIntoDashboard() above — nothing saved
      // yet, so pre-fill with the bundled services actually live on the
      // homepage right now instead of showing a misleadingly empty list.
      currentServices = structuredClone(defaultServices);
      usingDefaults = true;
    }
  } catch (err) {
    currentServices = structuredClone(defaultServices);
    usingDefaults = true;
  }
  renderServicesList(usingDefaults);
}

/* ---------------------------------------------------------------------------
   Sidebar panel switching (Hero / Ticker / Services / Fonts / Colors / Background)
   --------------------------------------------------------------------------- */
const ADMIN_PANELS = ["hero", "ticker", "services", "fonts", "colors", "background"];

function switchAdminPanel(panel) {
  for (const p of ADMIN_PANELS) {
    $(`admin-panel-${p}`).style.display = p === panel ? "" : "none";
  }
  document.querySelectorAll(".admin-side-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.panel === panel);
  });
}

function initSidebarNav() {
  document.querySelectorAll(".admin-side-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchAdminPanel(btn.dataset.panel));
  });
}

/* ---------------------------------------------------------------------------
   Shared color-pair + status helpers
   --------------------------------------------------------------------------- */
function setColorPair(pickerId, textId, value) {
  $(pickerId).value = value;
  $(textId).value = value;
}

function wireColorPair(pickerId, textId, onChange) {
  const picker = $(pickerId);
  const text = $(textId);
  picker.addEventListener("input", () => {
    text.value = picker.value;
    onChange(picker.value);
  });
  text.addEventListener("input", () => {
    const v = text.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      picker.value = v;
      onChange(v);
    }
  });
}

// Every panel edits the SAME in-memory currentSettings object and just
// saves the whole thing — simpler than partial-update endpoints, and the
// backend validates the complete blob either way.
async function saveSettingsSection(statusElId, btnId, successMessage) {
  const statusEl = $(statusElId);
  const btn = $(btnId);
  clearStatus(statusEl);
  btn.disabled = true;
  const originalLabel = btn.textContent;
  btn.textContent = "Saving...";
  try {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: currentSettings }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showStatus(statusEl, "error", data.error || "Could not save.");
      return;
    }
    showStatus(statusEl, "success", successMessage || "Saved! The live site now uses these settings.");
  } catch (err) {
    showStatus(statusEl, "error", "Network error — could not reach the server.");
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

/* ---------------------------------------------------------------------------
   Fonts panel — sourced ONLY from fonts/manifest.json (real files in the
   repo's /fonts folder), never from an in-browser upload. See
   scripts/generate-font-manifest.mjs.
   --------------------------------------------------------------------------- */
let fontManifestFamilies = []; // string[] of family names actually available

async function loadFontManifest() {
  try {
    const res = await fetch("/fonts/manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    fontManifestFamilies = Array.isArray(data.fonts) ? data.fonts.map((f) => f.family) : [];
  } catch (err) {
    fontManifestFamilies = [];
  }
}

function populateFontSelects() {
  // Latin selects: whatever's in the manifest, falling back to Montserrat
  // as a hardcoded option so the list is never empty even before any
  // fonts.rar-style upload has happened.
  const latinNames = fontManifestFamilies.length ? fontManifestFamilies : ["Montserrat"];
  const latinOptions = latinNames.map((f) => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`).join("");
  $("font-heading-select").innerHTML = latinOptions;
  $("font-body-select").innerHTML = latinOptions;
  $("font-heading-select").value = currentSettings.fonts.heading;
  $("font-body-select").value = currentSettings.fonts.body;
  if (!$("font-heading-select").value) {
    $("font-heading-select").value = latinNames[0];
    currentSettings.fonts.heading = latinNames[0];
  }
  if (!$("font-body-select").value) {
    $("font-body-select").value = latinNames[0];
    currentSettings.fonts.body = latinNames[0];
  }

  // Bengali select: manifest families PLUS "Noto Sans Bengali", which is
  // always available since it's loaded from Google Fonts in every page's
  // <head> regardless of what's in /fonts.
  const bengaliNames = [...new Set([...fontManifestFamilies, "Noto Sans Bengali"])];
  $("font-bengali-select").innerHTML = bengaliNames.map((f) => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`).join("");
  $("font-bengali-select").value = currentSettings.fonts.bengali;
  if (!$("font-bengali-select").value) {
    $("font-bengali-select").value = "Noto Sans Bengali";
    currentSettings.fonts.bengali = "Noto Sans Bengali";
  }
}

function initFontsEvents() {
  $("font-heading-select").addEventListener("change", (e) => {
    currentSettings.fonts.heading = e.target.value;
    applySiteSettings(currentSettings);
  });
  $("font-body-select").addEventListener("change", (e) => {
    currentSettings.fonts.body = e.target.value;
    applySiteSettings(currentSettings);
  });
  $("font-bengali-select").addEventListener("change", (e) => {
    currentSettings.fonts.bengali = e.target.value;
    applySiteSettings(currentSettings);
  });
  $("fonts-save-btn").addEventListener("click", () => saveSettingsSection("fonts-status", "fonts-save-btn", "Saved! Fonts updated site-wide."));
}

/* ---------------------------------------------------------------------------
   Colors & Glass panel
   --------------------------------------------------------------------------- */
function populateColorAndGlassFields() {
  const c = currentSettings.colors[appearanceMode];
  setColorPair("color-accent-picker", "color-accent", c.accent);
  setColorPair("color-accent2-picker", "color-accent2", c.accent2);
  setColorPair("color-heading-picker", "color-heading", c.heading);
  setColorPair("color-body-picker", "color-body", c.body);

  const g = currentSettings.glass[appearanceMode];
  $("glass-intensity").value = g.intensity;
}

function setAppearanceMode(mode) {
  appearanceMode = mode;
  const toggle = $("appearance-mode-toggle");
  const isDark = mode === "dark";
  toggle.setAttribute("aria-checked", isDark ? "true" : "false");
  toggle.setAttribute("aria-label", isDark ? "Editing dark mode — click for light mode" : "Editing light mode — click for dark mode");
  populateColorAndGlassFields();
}

function initModeToggle() {
  $("appearance-mode-toggle").addEventListener("click", () => {
    setAppearanceMode(appearanceMode === "light" ? "dark" : "light");
  });
}

function initColorsAndGlassEvents() {
  wireColorPair("color-accent-picker", "color-accent", (v) => {
    currentSettings.colors[appearanceMode].accent = v;
    applySiteSettings(currentSettings);
  });
  wireColorPair("color-accent2-picker", "color-accent2", (v) => {
    currentSettings.colors[appearanceMode].accent2 = v;
    applySiteSettings(currentSettings);
  });
  wireColorPair("color-heading-picker", "color-heading", (v) => {
    currentSettings.colors[appearanceMode].heading = v;
    applySiteSettings(currentSettings);
  });
  wireColorPair("color-body-picker", "color-body", (v) => {
    currentSettings.colors[appearanceMode].body = v;
    applySiteSettings(currentSettings);
  });

  $("glass-intensity").addEventListener("input", (e) => {
    currentSettings.glass[appearanceMode].intensity = Number(e.target.value);
    applySiteSettings(currentSettings);
  });

  $("colors-save-btn").addEventListener("click", () => saveSettingsSection("colors-status", "colors-save-btn", "Saved! Colors & glass updated site-wide."));
}

/* ---------------------------------------------------------------------------
   Background panel
   --------------------------------------------------------------------------- */
function updateBgTypeUI() {
  const type = currentSettings.background.type;
  document.querySelectorAll("#bg-type-toggle .device-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.bgtype === type));
  $("bg-solid-fields").style.display = type === "solid" ? "" : "none";
  $("bg-gradient-fields").style.display = type === "gradient" ? "" : "none";
  $("bg-image-fields").style.display = type === "image" ? "" : "none";
}

function initBgTypeToggle() {
  document.querySelectorAll("#bg-type-toggle .device-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSettings.background.type = btn.dataset.bgtype;
      updateBgTypeUI();
      applySiteSettings(currentSettings);
    });
  });
}

function initDevicePreviewToggles() {
  document.querySelectorAll(".admin-preview-devicebar").forEach((bar) => {
    const target = $(bar.dataset.previewFor);
    bar.querySelectorAll(".device-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        bar.querySelectorAll(".device-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
        target.classList.toggle("is-mobile-preview", btn.dataset.device === "mobile");
      });
    });
  });
}

function handleBgImageFileSelect(e) {
  const file = e.target.files[0];
  const statusEl = $("background-status");
  clearStatus(statusEl);
  if (!file) return;
  if (file.size > 2_900_000) {
    showStatus(statusEl, "error", "Background image is too large — please use a more compressed export (under ~2MB).");
    e.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const img = new Image();
    img.onload = () => {
      currentSettings.background.image = { dataUrl, width: img.naturalWidth, height: img.naturalHeight };
      $("bg-image-preview-img").src = dataUrl;
      applySiteSettings(currentSettings);
    };
    img.onerror = () => showStatus(statusEl, "error", "Couldn't read this file as an image.");
    img.src = dataUrl;
  };
  reader.onerror = () => showStatus(statusEl, "error", "Couldn't read this file.");
  reader.readAsDataURL(file);
}

function initBackgroundEvents() {
  initBgTypeToggle();

  wireColorPair("bg-solid-picker", "bg-solid", (v) => {
    currentSettings.background.solid = v;
    applySiteSettings(currentSettings);
  });
  wireColorPair("bg-gradient-from-picker", "bg-gradient-from", (v) => {
    currentSettings.background.gradientFrom = v;
    applySiteSettings(currentSettings);
  });
  wireColorPair("bg-gradient-to-picker", "bg-gradient-to", (v) => {
    currentSettings.background.gradientTo = v;
    applySiteSettings(currentSettings);
  });
  $("bg-gradient-angle").addEventListener("input", (e) => {
    currentSettings.background.gradientAngle = Number(e.target.value);
    $("bg-gradient-angle-value").textContent = `${e.target.value}°`;
    applySiteSettings(currentSettings);
  });
  $("bg-image-file-input").addEventListener("change", handleBgImageFileSelect);

  $("background-save-btn").addEventListener("click", () => saveSettingsSection("background-status", "background-save-btn", "Saved! Background updated site-wide."));
}

/* ---------------------------------------------------------------------------
   Load everything into the Appearance-related panels
   --------------------------------------------------------------------------- */
async function loadSettingsIntoDashboard() {
  try {
    const res = await fetch("/api/settings", { cache: "no-store" });
    const data = await res.json();
    currentSettings = data.settings && typeof data.settings === "object" ? data.settings : structuredClone(defaultSiteSettings);
  } catch (err) {
    currentSettings = structuredClone(defaultSiteSettings);
  }
  // Defensive fallback for any section missing from an older saved blob.
  currentSettings.fonts = currentSettings.fonts || structuredClone(defaultSiteSettings.fonts);
  currentSettings.colors = currentSettings.colors || structuredClone(defaultSiteSettings.colors);
  currentSettings.background = currentSettings.background || structuredClone(defaultSiteSettings.background);
  currentSettings.glass = currentSettings.glass || structuredClone(defaultSiteSettings.glass);
  currentSettings.heroPosition = currentSettings.heroPosition || structuredClone(defaultSiteSettings.heroPosition);

  await loadFontManifest();
  populateFontSelects();
  populateColorAndGlassFields();
  updateBgTypeUI();
  setColorPair("bg-solid-picker", "bg-solid", currentSettings.background.solid);
  setColorPair("bg-gradient-from-picker", "bg-gradient-from", currentSettings.background.gradientFrom);
  setColorPair("bg-gradient-to-picker", "bg-gradient-to", currentSettings.background.gradientTo);
  $("bg-gradient-angle").value = currentSettings.background.gradientAngle;
  $("bg-gradient-angle-value").textContent = `${currentSettings.background.gradientAngle}°`;
  if (currentSettings.background.image?.dataUrl) {
    $("bg-image-preview-img").src = currentSettings.background.image.dataUrl;
  }
  $("hero-pos-desktop").value = currentSettings.heroPosition.desktop;
  $("hero-pos-mobile").value = currentSettings.heroPosition.mobile;
  updateHeroPositionLabels();

  applySiteSettings(currentSettings);
}

async function loadDashboardData() {
  await Promise.all([loadServicesIntoDashboard(), loadTickerIntoDashboard(), loadHeroIntoDashboard(), loadSettingsIntoDashboard()]);
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const statusEl = $("admin-login-status");
  const submitBtn = $("admin-login-submit");
  const password = $("admin-password").value;
  clearStatus(statusEl);

  submitBtn.disabled = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = "Logging in...";

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showStatus(statusEl, "error", data.error || "Login failed.");
      return;
    }
    $("admin-password").value = "";
    showDashboardView();
    await loadDashboardData();
  } catch (err) {
    showStatus(statusEl, "error", "Network error — could not reach the server.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
}

async function handleLogout() {
  try {
    await fetch("/api/admin/logout", { method: "POST" });
  } catch (err) {
    /* proceed to show the login view regardless */
  }
  showLoginView();
}

/* ---------------------------------------------------------------------------
   Init
   --------------------------------------------------------------------------- */
async function init() {
  initLoadingScreen();
  initTheme();
  initServicesListEvents();
  initTickerListEvents();
  initSidebarNav();
  initHeroThemeToggle();
  initHeroPositionEvents();
  initModeToggle();
  initColorsAndGlassEvents();
  initBackgroundEvents();
  initDevicePreviewToggles();
  initFontsEvents();

  $("admin-login-form").addEventListener("submit", handleLoginSubmit);
  $("admin-logout-btn").addEventListener("click", handleLogout);
  $("admin-add-btn").addEventListener("click", handleAddService);
  $("admin-save-btn").addEventListener("click", handleSave);
  $("ticker-add-btn").addEventListener("click", handleAddTickerLine);
  $("ticker-save-btn").addEventListener("click", handleSaveTicker);
  $("hero-file-input").addEventListener("change", handleHeroFileSelect);
  $("hero-save-btn").addEventListener("click", handleSaveHero);

  const authenticated = await checkAuth();
  if (authenticated) {
    showDashboardView();
    await loadDashboardData();
  } else {
    showLoginView();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
