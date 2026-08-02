/* ==========================================================================
   Ovi's Fix — contact-form.js
   Client-side validation + submit to /api/contact (see api/contact.js and
   functions/api/contact.js for the two backend implementations).
   ========================================================================== */

import { translations } from "./translations.js";
import { getCurrentLanguage } from "./language.js";

function currentDict() {
  return translations[getCurrentLanguage()] || translations.en;
}

function showStatus(statusEl, type, message) {
  statusEl.textContent = message;
  statusEl.classList.remove("is-success", "is-error");
  statusEl.classList.add("is-visible", type === "success" ? "is-success" : "is-error");
}

export function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusEl = document.getElementById("form-status");
  const submitBtn = document.getElementById("form-submit");
  const submitLabel = submitBtn ? submitBtn.querySelector("[data-i18n]") : null;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dict = currentDict();

    const name = form.querySelector("#contact-name").value.trim();
    const email = form.querySelector("#contact-email").value.trim();
    const phone = form.querySelector("#contact-phone").value.trim();
    const message = form.querySelector("#contact-message").value.trim();
    const honeypot = form.querySelector("#contact-website").value.trim();

    // Honeypot: real users never fill this hidden field in.
    if (honeypot) return;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || !emailOk || !message) {
      showStatus(statusEl, "error", dict.contact.formError);
      return;
    }

    const originalLabel = submitLabel ? submitLabel.textContent : null;
    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = dict.contact.formSubmitting;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });

      if (!res.ok) throw new Error("Request failed");

      showStatus(statusEl, "success", dict.contact.formSuccess);
      form.reset();
    } catch (err) {
      showStatus(statusEl, "error", dict.contact.formError);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = originalLabel;
    }
  });
}
