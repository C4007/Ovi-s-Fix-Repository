// ============================================================================
// lib/settings-store.js — site-wide appearance settings: fonts, theme
// colors, page background, and the glass (blur/tint) intensity of the
// ticker bar + navbar. One JSON blob, same pattern as hero-store.js /
// services-store.js / ticker-store.js.
// ============================================================================

import { kvGet, kvSet } from "./upstash.js";

const SETTINGS_KEY = "ovisfix:site-settings";

export const DEFAULT_SETTINGS = {
  fonts: {
    heading: "Montserrat",
    body: "Montserrat",
    bengali: "Kalpurush",
  },
  colors: {
    light: { accent: "#e4342f", accent2: "#2f6fed", heading: "#0b1b33", body: "#2c3546" },
    dark: { accent: "#ff5d57", accent2: "#2f6fed", heading: "#eef1f8", body: "#ffffff" },
  },
  background: {
    type: "default", // "default" | "solid" | "gradient" | "image"
    solid: "#f6f5f1",
    gradientFrom: "#0b1b33",
    gradientTo: "#2f6fed",
    gradientAngle: 135,
    image: null, // { dataUrl, width, height }
  },
  glass: {
    // Single 0–100 dial, left = Clear (more transparent) / right = Tinted
    // (more opaque, higher contrast) — mirrors iOS's Liquid Glass slider.
    // See glassValuesFromIntensity() in js/site-settings.js for how this
    // maps to actual blur + alpha.
    light: { intensity: 40 },
    dark: { intensity: 40 },
  },
  heroPosition: {
    // Horizontal focal point of the hero banner, 0 (left) – 100 (right).
    // Vertical stays centered. Applies to whichever image is showing
    // (light/dark banners are set separately — see lib/hero-store.js).
    desktop: 100,
    mobile: 70,
  },
  updatedAt: null,
};

function mergeDefaults(stored) {
  // Shallow-merge per section so older saved blobs (before a new field was
  // added) don't crash the renderer — missing keys just fall back to default.
  return {
    fonts: { ...DEFAULT_SETTINGS.fonts, ...(stored.fonts || {}) },
    colors: {
      light: { ...DEFAULT_SETTINGS.colors.light, ...(stored.colors?.light || {}) },
      dark: { ...DEFAULT_SETTINGS.colors.dark, ...(stored.colors?.dark || {}) },
    },
    background: { ...DEFAULT_SETTINGS.background, ...(stored.background || {}) },
    glass: {
      light: { ...DEFAULT_SETTINGS.glass.light, ...(stored.glass?.light || {}) },
      dark: { ...DEFAULT_SETTINGS.glass.dark, ...(stored.glass?.dark || {}) },
    },
    heroPosition: { ...DEFAULT_SETTINGS.heroPosition, ...(stored.heroPosition || {}) },
    updatedAt: stored.updatedAt || null,
  };
}

export async function getStoredSettings(env) {
  const result = await kvGet(env, SETTINGS_KEY);
  if (!result.ok || !result.value) return { settings: DEFAULT_SETTINGS, source: "default" };
  try {
    const parsed = JSON.parse(result.value);
    if (!parsed || typeof parsed !== "object") return { settings: DEFAULT_SETTINGS, source: "malformed" };
    return { settings: mergeDefaults(parsed), source: "kv" };
  } catch (err) {
    return { settings: DEFAULT_SETTINGS, source: "malformed" };
  }
}

export async function saveSettings(env, settings) {
  return kvSet(env, SETTINGS_KEY, JSON.stringify(settings));
}
