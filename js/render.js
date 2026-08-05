/* ==========================================================================
   Ovi's Fix — render.js
   Builds the data-driven, bilingual sections (services, comparison, why-us,
   FAQ, terms) into their containers. Called once on load and again on every
   "ovisfix:languagechange" event, so containers are safe to fully rebuild.
   ========================================================================== */

import { services, comparison, whyUs, faq, terms, stats } from "./data.js";
import { translations } from "./translations.js";
import { icon } from "./icons.js";
import { getCurrentLanguage } from "./language.js";
import { observeReveal, prefersReducedMotion } from "./animations.js";

function t() {
  const lang = getCurrentLanguage();
  return { lang, dict: translations[lang] || translations.en };
}

function staggerDelay(index) {
  return Math.min(index, 8) * 60;
}

/* ---------------------------------------------------------------------------
   Services
   --------------------------------------------------------------------------- */
function serviceCard(service, lang, dict, index) {
  const isFree = !!service.free;
  const priceMarkup = isFree
    ? `<div class="price-ticket is-free"><span class="amount">${dict.services.priceFree}</span></div>`
    : `<div class="price-ticket"><span class="currency">${dict.services.unitPrefix}</span><span class="amount">${service.price}</span><span class="unit">/ ${service.unit[lang]}</span></div>`;

  const mediaMarkup = isFree
    ? `<div class="service-card-image">${icon("report")}</div>`
    : `<div class="service-card-image"><img src="images/${service.image}" alt="${service.title.en}" loading="lazy" width="400" height="250"></div>`;

  return `
    <article class="service-card glass reveal${isFree ? " is-free" : ""}" style="--reveal-delay:${staggerDelay(index)}ms" data-service-title="${service.title[lang].replace(/"/g, "&quot;")}">
      ${mediaMarkup}
      <div class="service-card-body">
        <h3 class="service-card-title">${service.title[lang]}</h3>
        <p class="service-card-desc">${service.desc[lang]}</p>
        <div class="service-card-footer">
          ${priceMarkup}
          <button type="button" class="service-card-cta" aria-label="${dict.services.ctaCard}">${icon("arrow")}</button>
        </div>
      </div>
    </article>`;
}

export function renderServices() {
  const container = document.getElementById("services-grid");
  if (!container) return;
  const { lang, dict } = t();

  container.innerHTML = services.map((s, i) => serviceCard(s, lang, dict, i)).join("");

  container.querySelectorAll(".service-card").forEach((card) => {
    const btn = card.querySelector(".service-card-cta");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const title = card.getAttribute("data-service-title");
      const contactSection = document.getElementById("contact");
      const messageField = document.getElementById("contact-message");
      if (messageField) {
        const prefix = getCurrentLanguage() === "bn" ? "আমি বুক করতে চাই: " : "I'd like to book: ";
        if (!messageField.value) messageField.value = `${prefix}${title}\n`;
      }
      if (contactSection && typeof contactSection.scrollIntoView === "function") {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
      if (messageField) setTimeout(() => messageField.focus(), 500);
    });
  });

  observeReveal(container.querySelectorAll(".reveal"));
}

/* ---------------------------------------------------------------------------
   Comparison table
   --------------------------------------------------------------------------- */
export function renderComparison() {
  const body = document.getElementById("comparison-body");
  if (!body) return;
  const { lang, dict } = t();

  body.innerHTML = comparison
    .map((row, i) => {
      const service = services.find((s) => s.id === row.id);
      if (!service) return "";
      const savePct = Math.round(((row.market - service.price) / row.market) * 100);
      return `
        <tr class="reveal" style="--reveal-delay:${staggerDelay(i)}ms">
          <td class="cmp-service">${service.title[lang]}</td>
          <td class="cmp-market">${dict.services.unitPrefix}${row.market}</td>
          <td class="cmp-ovi">${dict.services.unitPrefix}${service.price}</td>
          <td><span class="save-badge">-${savePct}%</span></td>
        </tr>`;
    })
    .join("");

  observeReveal(body.querySelectorAll(".reveal"));
}

/* ---------------------------------------------------------------------------
   Why us
   --------------------------------------------------------------------------- */
export function renderWhyUs() {
  const container = document.getElementById("whyus-grid");
  if (!container) return;
  const { lang } = t();

  container.innerHTML = whyUs
    .map(
      (item, i) => `
      <div class="whyus-card glass reveal" style="--reveal-delay:${staggerDelay(i)}ms">
        <div class="whyus-icon">${icon(item.icon)}</div>
        <h3>${item.title[lang]}</h3>
        <p>${item.desc[lang]}</p>
      </div>`
    )
    .join("");

  observeReveal(container.querySelectorAll(".reveal"));
}

/* ---------------------------------------------------------------------------
   FAQ
   --------------------------------------------------------------------------- */
export function renderFAQ() {
  const container = document.getElementById("faq-list");
  if (!container) return;
  const { lang } = t();

  container.innerHTML = faq
    .map(
      (item, i) => `
      <div class="faq-item glass reveal" data-open="false" style="--reveal-delay:${staggerDelay(i)}ms">
        <button type="button" class="faq-question" aria-expanded="false" id="faq-q-${i}" aria-controls="faq-a-${i}">
          <span>${item.q[lang]}</span>
          <span class="faq-icon">${icon("plus")}</span>
        </button>
        <div class="faq-answer" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}">
          <div class="faq-answer-inner"><p>${item.a[lang]}</p></div>
        </div>
      </div>`
    )
    .join("");

  container.querySelectorAll(".faq-item").forEach((el) => {
    const btn = el.querySelector(".faq-question");
    btn.addEventListener("click", () => {
      const isOpen = el.getAttribute("data-open") === "true";
      // close siblings for a clean accordion feel
      container.querySelectorAll(".faq-item").forEach((sib) => {
        sib.setAttribute("data-open", "false");
        sib.querySelector(".faq-question").setAttribute("aria-expanded", "false");
      });
      el.setAttribute("data-open", isOpen ? "false" : "true");
      btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });
  });

  observeReveal(container.querySelectorAll(".reveal"));
}

/* ---------------------------------------------------------------------------
   Terms (terms.html only)
   --------------------------------------------------------------------------- */
export function renderTerms() {
  const container = document.getElementById("terms-list");
  if (!container) return;
  const { lang } = t();

  container.innerHTML = terms
    .map(
      (item, i) => `
      <div class="terms-item glass reveal" style="--reveal-delay:${staggerDelay(i)}ms">
        <span class="terms-index mono">0${i + 1}</span>
        <p>${item[lang]}</p>
      </div>`
    )
    .join("");

  observeReveal(container.querySelectorAll(".reveal"));
}

/* ---------------------------------------------------------------------------
   Hero stats strip — icon + big count-up number + label
   --------------------------------------------------------------------------- */
let statsHasPlayedOnce = false;

function animateCount(el, target, suffix, duration) {
  if (prefersReducedMotion) {
    el.textContent = target + suffix;
    return;
  }
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(tick);
}

function playStatsAnimation() {
  const container = document.getElementById("hero-stats");
  if (!container) return;

  container.querySelectorAll(".hero-stat-value[data-count-target]").forEach((el, i) => {
    const target = parseInt(el.getAttribute("data-count-target"), 10);
    const suffix = el.getAttribute("data-count-suffix") || "";
    el.textContent = "0" + suffix;
    setTimeout(() => animateCount(el, target, suffix, 1100), i * 90);
  });

  container.querySelectorAll(".hero-stat-value.is-free").forEach((el, i) => {
    el.classList.remove("pop-in");
    // force reflow so the animation can replay on language toggle
    void el.offsetWidth;
    el.classList.add("pop-in");
  });
}

function scheduleStatsAnimation() {
  if (statsHasPlayedOnce || !document.getElementById("loading-screen")) {
    playStatsAnimation();
    statsHasPlayedOnce = true;
    return;
  }
  document.addEventListener(
    "ovisfix:loaded",
    () => {
      statsHasPlayedOnce = true;
      playStatsAnimation();
    },
    { once: true }
  );
}

export function renderStats() {
  const container = document.getElementById("hero-stats");
  if (!container) return;
  const { lang, dict } = t();

  container.innerHTML = stats
    .map((s) => {
      const valueMarkup = s.free
        ? `<div class="hero-stat-value is-free">${dict.services.priceFree}</div>`
        : `<div class="hero-stat-value" data-count-target="${s.count}" data-count-suffix="${s.suffix || ""}">0${s.suffix || ""}</div>`;
      return `
      <div class="hero-stat-card">
        <div class="hero-stat-icon">${icon(s.icon)}</div>
        ${valueMarkup}
        <div class="hero-stat-label">${s.label[lang]}</div>
      </div>`;
    })
    .join("");

  scheduleStatsAnimation();
}

/* ---------------------------------------------------------------------------
   Render everything present on the current page
   --------------------------------------------------------------------------- */
export function renderAll() {
  renderStats();
  renderServices();
  renderComparison();
  renderWhyUs();
  renderFAQ();
  renderTerms();
}
