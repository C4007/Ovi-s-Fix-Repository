// ============================================================================
// lib/hero-store.js — the custom hero banner image(s), admin-uploaded.
// Stored as ONE JSON blob with a separate slot per theme:
//   { light: {dataUrl,width,height}|null, dark: {dataUrl,width,height}|null, updatedAt }
// Each slot falls back independently to the bundled default banner on the
// client (see defaultHeroImage in js/data.js) when empty.
//
// Migration note: this used to be a single flat {dataUrl,width,height}
// object (one image for both themes). Any blob already saved in that old
// shape is treated as the DARK-mode image on read (dark was the site's
// original/default look), leaving light empty so it falls back to the
// bundled default with the lighter light-mode scrim.
// ============================================================================

import { kvGet, kvSet } from "./upstash.js";

const HERO_KEY = "ovisfix:hero-image";

function isImageShape(v) {
  return v && typeof v === "object" && typeof v.dataUrl === "string";
}

export async function getStoredHero(env) {
  const result = await kvGet(env, HERO_KEY);
  if (!result.ok) return { light: null, dark: null, source: result.reason };
  if (!result.value) return { light: null, dark: null, source: "empty" };
  try {
    const parsed = JSON.parse(result.value);
    if (!parsed || typeof parsed !== "object") return { light: null, dark: null, source: "malformed" };

    // Old flat shape: { dataUrl, width, height, updatedAt } — no light/dark keys.
    if (isImageShape(parsed) && !("light" in parsed) && !("dark" in parsed)) {
      return { light: null, dark: parsed, source: "kv-migrated" };
    }

    const light = isImageShape(parsed.light) ? parsed.light : null;
    const dark = isImageShape(parsed.dark) ? parsed.dark : null;
    return { light, dark, source: "kv" };
  } catch (err) {
    return { light: null, dark: null, source: "malformed" };
  }
}

export async function saveHeroForTheme(env, theme, image) {
  const current = await getStoredHero(env);
  const next = {
    light: theme === "light" ? image : current.light,
    dark: theme === "dark" ? image : current.dark,
    updatedAt: Date.now(),
  };
  const result = await kvSet(env, HERO_KEY, JSON.stringify(next));
  return { ...result, data: next };
}
