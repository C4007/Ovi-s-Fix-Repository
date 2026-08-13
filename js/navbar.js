/* ==========================================================================
   Ovi's Fix — navbar.js
   Mobile hamburger menu: open/close, backdrop click, Escape key, and
   auto-close when a link is tapped (single-page anchor navigation).
   ========================================================================== */

export function initMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("mobile-menu");
  const scrim = document.getElementById("mobile-menu-scrim");
  if (!toggle || !menu || !scrim) return;

  function open() {
    menu.classList.add("is-open");
    scrim.classList.add("is-open");
    toggle.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
  }

  function close() {
    menu.classList.remove("is-open");
    scrim.classList.remove("is-open");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
  }

  toggle.addEventListener("click", () => {
    if (menu.classList.contains("is-open")) close();
    else open();
  });

  scrim.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) close();
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) close();
  });
}
