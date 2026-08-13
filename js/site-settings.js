// ============================================================================
// js/site-settings.js — turns a settings object (see defaultSiteSettings in
// data.js / DEFAULT_SETTINGS in lib/settings-store.js) into live CSS,
// injected as one <style> tag. Shared by:
//   - js/render.js on the public site (apply once, on load)
//   - js/admin.js on the Appearance tab (apply live, on every field change,
//     for instant preview before you hit Save)
// ============================================================================

const STYLE_TAG_ID = "ovisfix-dynamic-settings";
const FONT_LINK_ID = "ovisfix-dynamic-google-fonts";
const GLASS_TINT_ALPHA = { clear: { light: 0.45, dark: 0.55 }, tinted: { light: 0.85, dark: 0.88 } };

// Curated, known-good Google Fonts offered in the admin panel's font
// pickers. Anything NOT in this list is assumed to be a custom uploaded
// font (rendered via the @font-face rules in buildFontFaceRules instead).
export const CURATED_GOOGLE_FONTS = [
  "Montserrat",
  "Poppins",
  "Inter",
  "Roboto",
  "Lato",
  "Nunito",
  "Sora",
  "Work Sans",
  "Space Grotesk",
  "Playfair Display",
];

function updateGoogleFontsLink(fonts) {
  const families = [fonts?.heading, fonts?.body].filter((name) => name && CURATED_GOOGLE_FONTS.includes(name));
  const unique = [...new Set(families)];

  let link = document.getElementById(FONT_LINK_ID);
  if (!unique.length) {
    if (link) link.remove();
    return;
  }
  const href =
    "https://fonts.googleapis.com/css2?" +
    unique.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700;800`).join("&") +
    "&display=swap";

  if (!link) {
    link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
}

function esc(str) {
  return String(str).replace(/["\\]/g, "");
}

function fontStack(name, fallbackVar) {
  // A user-typed or uploaded font name goes first, the site's existing
  // stack stays as the fallback so a typo or slow web font load never
  // results in text disappearing.
  return `"${esc(name)}", var(${fallbackVar})`;
}

function buildFontFaceRules(customFonts) {
  if (!Array.isArray(customFonts) || !customFonts.length) return "";
  return customFonts
    .map(
      (f) => `
@font-face {
  font-family: "${esc(f.name)}";
  src: url("${f.dataUrl}");
  font-display: swap;
}`
    )
    .join("\n");
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

function glassRgbaBase(theme) {
  // Same base RGB the bundled default already uses per theme (see
  // css/variables.css --ticker-bg / --nav-bg-scrolled) — only the alpha
  // (transparency) is adjustable from Admin, so "Clear" vs "Tinted" always
  // stays visually consistent with the rest of the theme.
  return theme === "dark" ? "3, 4, 6" : "255, 255, 255";
}

function buildGlassRule(theme, glassForTheme) {
  const tint = glassForTheme?.tint === "tinted" ? "tinted" : "clear";
  const alpha = GLASS_TINT_ALPHA[tint][theme];
  const blur = Number(glassForTheme?.blur);
  const blurPx = Number.isFinite(blur) ? Math.min(Math.max(blur, 0), 30) : 14;
  const rgb = glassRgbaBase(theme);
  return `
:root[data-theme="${theme}"] {
  --ticker-bg: rgba(${rgb}, ${alpha});
  --nav-bg-scrolled: rgba(${rgb}, ${alpha});
  --glass-blur: ${blurPx}px;
}`;
}

export function buildSettingsCSS(settings) {
  if (!settings) return "";
  const { fonts, colors, background, glass } = settings;
  const parts = [];

  if (fonts) {
    parts.push(buildFontFaceRules(fonts.customFonts));
    parts.push(`
:root {
  --font-display: ${fontStack(fonts.heading || "Montserrat", "--font-display")};
  --font-body: ${fontStack(fonts.body || "Montserrat", "--font-body")};
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
  updateGoogleFontsLink(settings?.fonts);
}
