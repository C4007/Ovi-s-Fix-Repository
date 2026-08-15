// ============================================================================
// js/glass-adapt.js — keeps text/icons on the fixed navbar + ticker glass
// readable no matter what's showing through it. The glass is translucent
// by design, so a dark hero photo behind it needs light text, but once
// you scroll past the hero onto a light page background, the SAME glass
// panel needs dark text — independent of whether the site is in light or
// dark THEME (those are a different axis: a dark-mode site can still have
// a light page background image, etc).
//
// How it decides light vs dark: sample the average brightness of whatever
// is currently behind the bar (the hero image while it's in view, or the
// page background once scrolled past it) and flip a class accordingly.
// ============================================================================

function relativeLuminance(r, g, b) {
  const toLinear = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function luminanceFromHex(hex) {
  if (typeof hex !== "string") return null;
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (full.length !== 6) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return relativeLuminance(r, g, b);
}

function sampleImageLuminance(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Only the top ~28% of the image ever sits behind the fixed bar
        // (background-size:cover, background-position:center right) — sample
        // that band only, downscaled hard since we just need an average.
        const w = 24;
        const h = 6;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        const srcH = img.naturalHeight * 0.28;
        ctx.drawImage(img, 0, 0, img.naturalWidth, srcH, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let total = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += relativeLuminance(data[i], data[i + 1], data[i + 2]);
          count++;
        }
        resolve(count ? total / count : null);
      } catch (err) {
        resolve(null); // e.g. canvas tainted — fall back gracefully
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function luminanceOfBackground(background, theme) {
  const fallback = theme === "dark" ? 0.04 : 0.93; // matches the real default --bg tokens
  if (!background || background.type === "default") return fallback;
  if (background.type === "solid") return luminanceFromHex(background.solid) ?? fallback;
  if (background.type === "gradient") {
    const a = luminanceFromHex(background.gradientFrom);
    const b = luminanceFromHex(background.gradientTo);
    if (a === null && b === null) return fallback;
    return ((a ?? b) + (b ?? a)) / 2;
  }
  if (background.type === "image" && background.image?.dataUrl) {
    const l = await sampleImageLuminance(background.image.dataUrl);
    return l ?? fallback;
  }
  return fallback;
}

export async function initAdaptiveGlassText(settings, heroImageSrc) {
  const navEl = document.querySelector(".navbar");
  const tickerEl = document.querySelector(".top-ticker");
  const heroEl = document.querySelector(".hero");
  if (!navEl && !tickerEl) return;

  const currentTheme = () => document.documentElement.getAttribute("data-theme") || "light";

  const [heroLum, bgLum] = await Promise.all([
    heroEl ? sampleImageLuminance(heroImageSrc) : Promise.resolve(null),
    luminanceOfBackground(settings?.background, currentTheme()),
  ]);

  function setFor(lum) {
    const isDark = lum !== null && lum < 0.5;
    for (const el of [navEl, tickerEl]) {
      if (!el) continue;
      el.classList.toggle("glass-on-dark", isDark);
      el.classList.toggle("glass-on-light", !isDark);
    }
  }

  let ticking = false;
  function update() {
    if (heroEl && heroLum !== null && window.scrollY < heroEl.offsetHeight - 40) {
      setFor(heroLum);
    } else {
      setFor(bgLum);
    }
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}
