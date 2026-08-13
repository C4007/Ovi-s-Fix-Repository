// ============================================================================
// lib/validate-settings.js — validation for the site-wide appearance
// settings payload (fonts, colors, background, glass). Same "reject before
// it saves" philosophy as validate-hero.js: strict enough that a bad value
// can never reach the live site and break rendering.
// ============================================================================

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const FONT_NAME_MAX = 80;
const CUSTOM_FONT_MAX_DATA_URL_LENGTH = 600_000; // ~450KB of raw font data, base64-encoded
const CUSTOM_FONT_MAX_COUNT = 6;
const BG_IMAGE_MAX_DATA_URL_LENGTH = 2_800_000; // ~2MB, same budget as the hero banner

function isHex(v) {
  return typeof v === "string" && HEX_RE.test(v);
}

function isFontName(v) {
  return typeof v === "string" && v.trim().length > 0 && v.length <= FONT_NAME_MAX;
}

export function validateSettings(settings) {
  if (!settings || typeof settings !== "object") return "No settings data received.";

  // ---- fonts ----
  const fonts = settings.fonts;
  if (!fonts || typeof fonts !== "object") return "Missing font settings.";
  if (!isFontName(fonts.heading)) return "Heading font name is missing or too long.";
  if (!isFontName(fonts.body)) return "Body font name is missing or too long.";
  if (fonts.customFonts !== undefined) {
    if (!Array.isArray(fonts.customFonts)) return "Custom fonts must be a list.";
    if (fonts.customFonts.length > CUSTOM_FONT_MAX_COUNT) {
      return `Too many uploaded fonts — please keep it to ${CUSTOM_FONT_MAX_COUNT} or fewer.`;
    }
    for (const f of fonts.customFonts) {
      if (!f || typeof f !== "object") return "A custom font entry is malformed.";
      if (!isFontName(f.name)) return "A custom font is missing a valid name.";
      if (typeof f.dataUrl !== "string" || !/^data:(font|application)\//.test(f.dataUrl)) {
        return `Custom font "${f.name}" isn't a valid font file.`;
      }
      if (f.dataUrl.length > CUSTOM_FONT_MAX_DATA_URL_LENGTH) {
        return `Custom font "${f.name}" is too large — please use a compressed WOFF2 export (under ~450KB).`;
      }
    }
  }

  // ---- colors ----
  const colors = settings.colors;
  if (!colors || typeof colors !== "object") return "Missing color settings.";
  for (const mode of ["light", "dark"]) {
    const c = colors[mode];
    if (!c || typeof c !== "object") return `Missing ${mode}-mode colors.`;
    for (const key of ["accent", "accent2", "heading", "body"]) {
      if (!isHex(c[key])) return `"${key}" in ${mode} mode isn't a valid hex color (e.g. #2f6fed).`;
    }
  }

  // ---- background ----
  const bg = settings.background;
  if (!bg || typeof bg !== "object") return "Missing background settings.";
  if (!["default", "solid", "gradient", "image"].includes(bg.type)) {
    return "Background type must be default, solid, gradient, or image.";
  }
  if (bg.type === "solid" && !isHex(bg.solid)) return "Background solid color isn't a valid hex color.";
  if (bg.type === "gradient") {
    if (!isHex(bg.gradientFrom) || !isHex(bg.gradientTo)) return "Gradient colors must be valid hex colors.";
    const angle = Number(bg.gradientAngle);
    if (!Number.isFinite(angle) || angle < 0 || angle > 360) return "Gradient angle must be between 0 and 360.";
  }
  if (bg.type === "image") {
    const img = bg.image;
    if (!img || typeof img !== "object") return "No background image data received.";
    if (typeof img.dataUrl !== "string" || !img.dataUrl.startsWith("data:image/")) {
      return "Background image doesn't look like a valid image.";
    }
    if (img.dataUrl.length > BG_IMAGE_MAX_DATA_URL_LENGTH) {
      return "Background image is too large — please use a more compressed export (under ~2MB).";
    }
  }

  // ---- glass ----
  const glass = settings.glass;
  if (!glass || typeof glass !== "object") return "Missing glass settings.";
  for (const mode of ["light", "dark"]) {
    const g = glass[mode];
    if (!g || typeof g !== "object") return `Missing ${mode}-mode glass settings.`;
    const blur = Number(g.blur);
    if (!Number.isFinite(blur) || blur < 0 || blur > 30) return `Glass blur (${mode} mode) must be between 0 and 30.`;
    if (!["clear", "tinted"].includes(g.tint)) return `Glass tint (${mode} mode) must be "clear" or "tinted".`;
  }

  return null;
}
