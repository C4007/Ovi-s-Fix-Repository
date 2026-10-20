/* ==========================================================================
   Ovi's Fix — layout.js
   One header, footer and floating WhatsApp button for every page, so a change
   here (or in Admin → Store settings) updates the whole site. Pages only need
   <div id="app-header"></div> and <div id="app-footer"></div>.
   ========================================================================== */

import { icon } from "./icons.js";
import { CATEGORIES, SUBS } from "./catalog-schema.js";
import { seedStore } from "./shop-seed.js";
import { T, loc, esc, shop, cart, waLink, catLabel, subLabel, catUrl, subUrl } from "./shop-core.js";

const NAV = [
  { key: "home", href: "/home", label: "nav.home" },
  { key: "shop", href: "/shop", label: "nav.shop", menu: true },
  { key: "builder", href: "/pc-builder", label: "nav.builder", beta: true },
  { key: "builds", href: "/builds", label: "nav.builds" },
  { key: "offers", href: "/offers", label: "nav.offers" },
  { key: "service", href: "/service", label: "nav.service" },
];

const SOCIAL_ICONS = {
  facebook: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M14 9h-1.3a1.3 1.3 0 00-1.3 1.3V12h2.6l-.4 2.6h-2.2V20"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/>',
  youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.2 9.4l4.6 2.6-4.6 2.6z"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 10.5V16M8 7.8v.01M11.5 16v-3.2a2 2 0 014 0V16M11.5 10.5V16"/>',
};
const WA_PATH = '<path d="M12 2.8a9.2 9.2 0 00-7.9 13.8L3 21.2l4.7-1.2A9.2 9.2 0 1012 2.8z"/><path d="M8.4 8.6c0-.3.25-.5.55-.5h.9c.28 0 .53.18.62.45l.55 1.5c.1.28 0 .58-.2.77l-.53.5c.5 1.1 1.3 1.9 2.4 2.4l.5-.53c.2-.2.5-.28.77-.2l1.5.55c.27.1.45.35.45.62v.9c0 .3-.2.55-.5.55-3.2.35-6.7-3.1-6.5-6.5z"/>';
const svg = (body, cls = "") => `<svg ${cls ? `class="${cls}" ` : ""}viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const store = () => ({ ...seedStore, ...(shop()?.store || {}) });

/** Categories (and sub-categories) that actually have products — empty ones stay out of menus. */
function visibleCategories() {
  const products = shop()?.products;
  const counts = {};
  if (products) for (const p of products) counts[p.sub] = (counts[p.sub] || 0) + 1;
  return Object.entries(CATEGORIES)
    .map(([key, c]) => ({ key, subs: c.subs.filter((s) => !products || counts[s]) }))
    .filter((c) => c.subs.length);
}

function shopMenuHTML() {
  return visibleCategories().map((c) => `
    <div class="nav-menu-col">
      <a class="nav-menu-head" href="${catUrl(c.key)}">${icon(CATEGORIES[c.key].icon)}<span>${esc(catLabel(c.key))}</span></a>
      ${c.subs.length > 1 ? `<ul>${c.subs.map((s) => `<li><a href="${subUrl(s)}">${esc(subLabel(s))}</a></li>`).join("")}</ul>` : ""}
    </div>`).join("");
}

function navLinksHTML(prefix) {
  return NAV.map((n) => {
    if (prefix === "desktop" && n.menu) {
      return `<div class="nav-drop"><a href="${n.href}" data-nav="${n.key}"><span data-i18n="${n.label}">${esc(T(n.label))}</span>${icon("chevrondown")}</a><div class="nav-menu glass-strong" data-r="shopmenu">${shopMenuHTML()}</div></div>`;
    }
    return `<a href="${n.href}" data-nav="${n.key}"><span data-i18n="${n.label}">${esc(T(n.label))}</span>${n.beta ? '<sup class="beta">Beta</sup>' : ""}</a>`;
  }).join("");
}

export function injectLayout(page) {
  const header = document.getElementById("app-header");
  if (header) {
    header.innerHTML = `
<div class="top-ticker"><div class="hero-ticker-fade"><div class="hero-ticker-track" id="hero-ticker-track"></div></div></div>
<nav class="navbar" id="navbar" aria-label="Primary">
  <div class="container navbar-inner">
    <a href="/home" class="brand" aria-label="Ovi's Fix — home">
      <div class="brand-mark"><img src="/images/favicon/favicon-192.png" alt="" width="46" height="46"></div>
      <span class="brand-name">Ovi's <span>Fix</span></span>
    </a>
    <div class="nav-links">${navLinksHTML("desktop")}</div>
    <div class="navbar-actions">
      <button id="lang-toggle" class="lang-toggle-btn" aria-label="Switch to Bangla" type="button">
        <svg class="flag-us" viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" fill="#B22234"/><rect y="1.23" width="24" height="1.23" fill="#fff"/><rect y="3.69" width="24" height="1.23" fill="#fff"/><rect y="6.15" width="24" height="1.23" fill="#fff"/><rect y="8.61" width="24" height="1.23" fill="#fff"/><rect y="11.08" width="24" height="1.23" fill="#fff"/><rect y="13.54" width="24" height="1.23" fill="#fff"/><rect width="10" height="8.6" fill="#3C3B6E"/></svg>
        <svg class="flag-bd" viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" fill="#006A4E"/><circle cx="10.5" cy="8" r="4.8" fill="#F42A41"/></svg>
      </button>
      <button id="theme-toggle" class="icon-btn" aria-label="Switch to dark mode" type="button">
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.8"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/></svg>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.6A8.6 8.6 0 119.4 4a7.1 7.1 0 0010.6 10.6z"/></svg>
      </button>
      <a href="/cart" class="icon-btn cart-btn" aria-label="${esc(T("nav.cart"))}" data-i18n-aria="nav.cart">${icon("cart")}<b id="cart-count" hidden>0</b></a>
      <button id="menu-toggle" class="icon-btn hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu" type="button"><span></span></button>
    </div>
  </div>
</nav>
<div class="mobile-menu-scrim" id="mobile-menu-scrim"></div>
<div class="mobile-menu acrylic" id="mobile-menu">
  <div class="mobile-menu-links">${navLinksHTML("mobile")}<a href="/service#contact"><span data-i18n="nav.contact">${esc(T("nav.contact"))}</span></a></div>
  <div class="mobile-menu-cats" data-r="mobilecats"></div>
  <a href="/service#contact" class="btn btn-primary btn-block mobile-menu-cta" data-i18n="nav.bookService">${esc(T("nav.bookService"))}</a>
</div>`;
    markActive(page);
  }

  const footer = document.getElementById("app-footer");
  if (footer) footer.innerHTML = footerHTML();

  if (!document.getElementById("wa-float")) {
    const a = document.createElement("a");
    a.id = "wa-float";
    a.className = "wa-float";
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = `${svg(WA_PATH)}<span data-i18n="shop.askExpert">${esc(T("shop.askExpert"))}</span>`;
    document.body.appendChild(a);
  }
  refreshStoreBits();
  updateCartBadge();
}

function markActive(page) {
  document.querySelectorAll("[data-nav]").forEach((a) => {
    const on = a.dataset.nav === page;
    a.classList.toggle("is-active", on);
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}

function footerHTML() {
  return `
<footer class="footer">
  <div class="container">
    <div class="footer-grid footer-grid-4">
      <div class="footer-brand">
        <div class="brand"><div class="brand-mark"><img src="/images/favicon/favicon-192.png" alt="" width="46" height="46"></div><span class="brand-name">Ovi's <span>Fix</span></span></div>
        <p class="footer-tagline" data-i18n="footer.tagline">Fix it. Optimize it. Keep it running.</p>
        <p class="footer-note" data-r="freenote"></p>
        <div class="footer-social" data-r="social"></div>
      </div>
      <div class="footer-col"><h4 data-i18n="nav.shop">Shop</h4><ul data-r="footshop"></ul></div>
      <div class="footer-col"><h4 data-i18n="footer.company">Company</h4><ul>
        <li><a href="/pc-builder" data-i18n="nav.builder">PC Builder</a></li>
        <li><a href="/builds" data-i18n="nav.builds">Pre-built PCs</a></li>
        <li><a href="/offers" data-i18n="nav.offers">Offers</a></li>
        <li><a href="/components" data-i18n="nav.priceList">Stock &amp; price list</a></li>
        <li><a href="/service" data-i18n="nav.service">Service</a></li>
        <li><a href="/terms" data-i18n="footer.terms">Terms &amp; Conditions</a></li>
      </ul></div>
      <div class="footer-col"><h4 data-i18n="footer.getInTouch">Get In Touch</h4><ul data-r="contact"></ul></div>
    </div>
    <div class="footer-bottom">
      <span>© <span id="year">${new Date().getFullYear()}</span> Ovi's Fix. <span data-i18n="footer.rights">All rights reserved.</span></span>
      <span class="footer-price-note" data-r="pricenote"></span>
    </div>
  </div>
</footer>`;
}

/** Fill in everything that comes from Store settings (WhatsApp number, contact details, notes) — safe to call repeatedly. */
export function refreshStoreBits() {
  const s = store();
  const wa = document.getElementById("wa-float");
  if (wa) wa.href = waLink(s.whatsappMessage || "");
  const q = (name) => document.querySelector(`[data-r="${name}"]`);

  const menu = q("shopmenu");
  if (menu) menu.innerHTML = shopMenuHTML();
  const mc = q("mobilecats");
  if (mc) mc.innerHTML = visibleCategories().map((c) => `<a href="${catUrl(c.key)}">${icon(CATEGORIES[c.key].icon)}<span>${esc(catLabel(c.key))}</span></a>`).join("");
  const fs = q("footshop");
  if (fs) fs.innerHTML = visibleCategories().map((c) => `<li><a href="${catUrl(c.key)}">${esc(catLabel(c.key))}</a></li>`).join("");

  const social = q("social");
  if (social) {
    const links = [["facebook", s.facebook, "Facebook"], ["instagram", s.instagram, "Instagram"], ["youtube", s.youtube, "YouTube"], ["linkedin", s.linkedin, "LinkedIn"]]
      .filter(([, url]) => url)
      .map(([k, url, name]) => `<a href="${esc(url)}" class="icon-btn" aria-label="${name}" target="_blank" rel="noopener">${svg(SOCIAL_ICONS[k])}</a>`);
    links.push(`<a href="${esc(waLink(""))}" class="icon-btn" aria-label="WhatsApp" target="_blank" rel="noopener">${svg(WA_PATH)}</a>`);
    social.innerHTML = links.join("");
  }
  const contact = q("contact");
  if (contact) {
    const digits = (s.phone || "").replace(/[^\d+]/g, "");
    contact.innerHTML = [
      s.email ? `<li><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>` : "",
      s.phone ? `<li><a href="${esc(waLink(""))}" target="_blank" rel="noopener">${esc(s.phone)}</a></li>` : "",
      s.altPhone ? `<li><a href="tel:${esc(s.altPhone.replace(/[^\d+]/g, ""))}">${esc(s.altPhone)}</a></li>` : "",
      loc(s.address) ? `<li>${esc(loc(s.address))}</li>` : "",
    ].join("");
    void digits;
  }
  const fn = q("freenote");
  if (fn) fn.textContent = [loc(s.freeServiceNote), loc(s.preorderNote)].filter(Boolean).join(" ");
  const pn = q("pricenote");
  if (pn) pn.textContent = loc(s.priceNote);
}

export function updateCartBadge() {
  const n = cart.count();
  const b = document.getElementById("cart-count");
  if (!b) return;
  b.textContent = n > 99 ? "99+" : String(n);
  b.hidden = n === 0;
}

document.addEventListener("ovisfix:cartchange", updateCartBadge);
document.addEventListener("ovisfix:languagechange", () => {
  refreshStoreBits();
});
