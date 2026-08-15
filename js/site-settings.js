// ============================================================================
// js/site-settings.js — turns a settings object (see defaultSiteSettings in
// data.js / DEFAULT_SETTINGS in lib/settings-store.js) into live CSS,
// injected as one <style> tag. Shared by:
//   - js/render.js on the public site (apply once, on load)
//   - js/admin.js on the Appearance tab (apply live, on every field change,
//     for instant preview before you hit Save)
//
// Fonts: the actual @font-face declarations are static, self-hosted, and
// pre-generated into css/fonts-generated.css by scripts/generate-font-manifest.mjs
// — this module just points --font-display/--font-body at whichever family
// name the admin picked. It does NOT load fonts from Google Fonts or from
// any uploaded/base64 data; the family has to already exist as files in
// /fonts (see fonts/manifest.json) for the browser to actually render it.
// ============================================================================

const STYLE_TAG_ID = "ovisfix-dynamic-settings";
const GLASS_TINT_ALPHA_BASE = 0.32; // intensity 0
const GLASS_TINT_ALPHA_RANGE = 0.58; // + up to this at intensity 100
const GLASS_BLUR_BASE = 4; // px, intensity 0
const GLASS_BLUR_RANGE = 20; // px, + up to this at intensity 100

// A concrete, non-self-referencing fallback stack. IMPORTANT: this must
// NOT be `var(--font-display)` — that would make the generated
// `--font-display` custom property redefine itself in terms of itself,
// which CSS treats as invalid (a cyclic var() reference computes to the
// property's "guaranteed-invalid value"). The practical symptom was every
// admin-chosen font silently failing and the whole site falling back to
// the browser's default serif font, since the invalid custom property
// took every real fallback down with it.
const SYSTEM_FALLBACK = '"Segoe UI", sans-serif';

function esc(str) {
  return String(str).replace(/["\\]/g, "");
}

function fontStack(name) {
  return `"${esc(name)}", ${SYSTEM_FALLBACK}`;
}

function bengaliFontStack(name) {
  // Bengali needs a Bengali-capable fallback, not the Latin system stack —
  // "Noto Sans Bengali" is always loaded (see the Google Fonts link in
  // <head>), so it's a safe universal fallback even if the chosen family
  // is missing.
  return `"${esc(name)}", "Noto Sans Bengali", sans-serif`;
}

function buildBackgroundRule(background) {
  if (!background || background.type === "default") return "";
  if (background.type === "solid") {
    return `body { background: ${background.solid} !important; }`;
  }
  if (background.type === "gradient") {
    return `body { background: linear-gradient(${Number(background.gradientAngle) || 0}deg, ${background.gradientFrom}, ${background.gradientTo}) !important; background-attachment: fixed !important; }`;
  }
  if (background.type === "image" && background.image?.dataUrl) {
    return `body { background: url("${background.image.dataUrl}") center / cover no-repeat fixed !important; }`;
  }
  return "";
}

// Maps the single 0–100 "Clear <-> Tinted" dial to real blur + alpha
// values. Exported so js/admin.js can show the same live numbers next to
// the slider that will actually be used.
export function glassValuesFromIntensity(intensity) {
  const t = Math.min(Math.max(Number(intensity) || 0, 0), 100) / 100;
  return {
    blur: Math.round((GLASS_BLUR_BASE + t * GLASS_BLUR_RANGE) * 10) / 10,
    alpha: Math.round((GLASS_TINT_ALPHA_BASE + t * GLASS_TINT_ALPHA_RANGE) * 100) / 100,
  };
}

function glassRgbaBase(theme) {
  // Same base RGB the bundled default already uses per theme (see
  // css/variables.css --ticker-bg / --nav-bg-scrolled) — only the alpha
  // (transparency) is adjustable from Admin, so the slider always stays
  // visually consistent with the rest of the theme.
  return theme === "dark" ? "3, 4, 6" : "255, 255, 255";
}

function buildGlassRule(theme, glassForTheme) {
  const { blur, alpha } = glassValuesFromIntensity(glassForTheme?.intensity ?? 40);
  const rgb = glassRgbaBase(theme);
  return `
:root[data-theme="${theme}"] {
  --ticker-bg: rgba(${rgb}, ${alpha});
  --nav-bg-scrolled: rgba(${rgb}, ${alpha});
  --glass-blur: ${blur}px;
}`;
}

export function buildSettingsCSS(settings) {
  if (!settings) return "";
  const { fonts, colors, background, glass, heroPosition } = settings;
  const parts = [];

  if (fonts) {
    parts.push(`
:root {
  --font-display: ${fontStack(fonts.heading || "Montserrat")};
  --font-body: ${fontStack(fonts.body || "Montserrat")};
  --font-bn: ${bengaliFontStack(fonts.bengali || "Kalpurush")};
}`);
  }

  if (colors) {
    for (const theme of ["light", "dark"]) {
      const c = colors[theme];
      if (!c) continue;
      parts.push(`
:root[data-theme="${theme}"] {
  --signal-red: ${c.accent};
  --signal-red-strong: ${c.accent};
  --circuit-blue: ${c.accent2};
  --text-heading: ${c.heading};
  --text-body: ${c.body};
}`);
    }
  }

  parts.push(buildBackgroundRule(background));

  if (glass) {
    parts.push(buildGlassRule("light", glass.light));
    parts.push(buildGlassRule("dark", glass.dark));
  }

  if (heroPosition) {
    const desktop = Math.min(Math.max(Number(heroPosition.desktop) || 0, 0), 100);
    const mobile = Math.min(Math.max(Number(heroPosition.mobile) || 0, 0), 100);
    parts.push(`
:root {
  --hero-pos-x-desktop: ${desktop}%;
  --hero-pos-x-mobile: ${mobile}%;
}`);
  }

  return parts.filter(Boolean).join("\n");
}

export function applySiteSettings(settings) {
  let tag = document.getElementById(STYLE_TAG_ID);
  if (!tag) {
    tag = document.createElement("style");
    tag.id = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }
  tag.textContent = buildSettingsCSS(settings);
}
