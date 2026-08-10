/* ==========================================================================
   Ovi's Fix — admin.js
   Login → dashboard → edit services in memory → Save All Changes writes the
   whole array back via POST /api/admin/services. Read access (GET
   /api/services) is public — only writing requires the session cookie.
   ========================================================================== */

import { initTheme } from "./theme.js";
import { initLoadingScreen } from "./animations.js";

let currentServices = [];
let currentTicker = [];
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

function renderTickerList() {
  const container = $("ticker-lines-list");
  if (!currentTicker.length) {
    container.innerHTML = '<div class="admin-empty-state glass">No ticker lines yet — click "+ Add Line" to create one.</div>';
    return;
  }
  container.innerHTML = currentTicker.map((line, i) => tickerLineMarkup(line, i, currentTicker.length)).join("");
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
  try {
    const res = await fetch("/api/ticker", { cache: "no-store" });
    const data = await res.json();
    currentTicker = Array.isArray(data.lines) ? data.lines : [];
  } catch (err) {
    currentTicker = [];
  }
  renderTickerList();
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
      $("hero-preview-meta").textContent = `${width} × ${height}px — ready to save`;
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
      body: JSON.stringify({ image: pendingHeroImage }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showStatus(statusEl, "error", data.error || "Could not save the hero image.");
      saveBtn.disabled = false;
      saveBtn.textContent = originalLabel;
      return;
    }
    showStatus(statusEl, "success", "Saved! The homepage will show this on next load.");
    pendingHeroImage = null;
    saveBtn.textContent = originalLabel;
  } catch (err) {
    showStatus(statusEl, "error", "Network error — could not reach the server.");
    saveBtn.disabled = false;
    saveBtn.textContent = originalLabel;
  }
}

async function loadHeroIntoDashboard() {
  const img = $("hero-preview-img");
  const meta = $("hero-preview-meta");
  try {
    const res = await fetch("/api/hero", { cache: "no-store" });
    const data = await res.json();
    if (data.image && data.image.dataUrl) {
      img.src = data.image.dataUrl;
      meta.textContent = `Current: ${data.image.width} × ${data.image.height}px`;
      return;
    }
  } catch (err) {
    /* fall through to default preview below */
  }
  img.src = "images/hero-banner.webp";
  meta.textContent = "Using the default bundled image — no custom upload saved yet.";
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

function renderServicesList() {
  const container = $("admin-services-list");
  if (!currentServices.length) {
    container.innerHTML = '<div class="admin-empty-state glass">No services yet — click "+ Add Service" to create your first one.</div>';
    return;
  }
  container.innerHTML = currentServices.map((s, i) => serviceCardMarkup(s, i)).join("");
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
  try {
    const res = await fetch("/api/services", { cache: "no-store" });
    const data = await res.json();
    currentServices = Array.isArray(data.services) ? data.services : [];
  } catch (err) {
    currentServices = [];
  }
  renderServicesList();
}

async function loadDashboardData() {
  await Promise.all([loadServicesIntoDashboard(), loadTickerIntoDashboard(), loadHeroIntoDashboard()]);
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
