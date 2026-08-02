/* ==========================================================================
   Ovi's Fix — animations.js
   Scroll reveal (IntersectionObserver), hero mouse-parallax, loading screen,
   and the navbar's scrolled-state toggle.
   ========================================================================== */

const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let revealObserver = null;

function getRevealObserver() {
  if (revealObserver) return revealObserver;
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  return revealObserver;
}

/** Observe a NodeList/array of elements for scroll-triggered reveal.
 *  Safe to call repeatedly / with overlapping sets — already-revealed
 *  elements simply get unobserved again with no visible effect. */
export function observeReveal(elements) {
  if (prefersReducedMotion) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = getRevealObserver();
  elements.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------------------------------------
   Hero mouse parallax
   --------------------------------------------------------------------------- */
export function initMouseParallax() {
  if (prefersReducedMotion) return;
  const hero = document.querySelector(".hero");
  const card = document.querySelector(".hero-card");
  if (!hero || !card) return;

  let raf = null;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  function loop() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    card.style.transform = `rotateY(${currentX}deg) rotateX(${currentY}deg) translateZ(0)`;
    if (Math.abs(targetX - currentX) > 0.02 || Math.abs(targetY - currentY) > 0.02) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(loop);
  }

  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    targetX = px * 14; // max ~7deg either way
    targetY = py * -10;
    kick();
  });

  hero.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
    kick();
  });
}

/* ---------------------------------------------------------------------------
   Loading screen
   --------------------------------------------------------------------------- */
export function initLoadingScreen() {
  const screen = document.getElementById("loading-screen");
  if (!screen) return;

  document.body.classList.add("no-scroll");
  const minTime = new Promise((resolve) => setTimeout(resolve, 1400));
  const windowLoaded = new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
  });
  // Whichever finishes last, but never wait more than ~3.2s total.
  const safety = new Promise((resolve) => setTimeout(resolve, 3200));

  Promise.race([Promise.all([minTime, windowLoaded]), safety]).then(() => {
    screen.classList.add("is-hidden");
    document.body.classList.remove("no-scroll");
    setTimeout(() => screen.remove(), 700);
  });
}

/* ---------------------------------------------------------------------------
   Navbar scrolled state
   --------------------------------------------------------------------------- */
export function initNavbarScroll() {
  const nav = document.querySelector(".navbar");
  if (!nav) return;

  function update() {
    if (window.scrollY > 12) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }

  update();
  window.addEventListener("scroll", update, { passive: true });
}
