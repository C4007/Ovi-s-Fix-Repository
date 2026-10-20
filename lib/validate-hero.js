// ============================================================================
// lib/validate-hero.js — strict validation for the admin-uploaded hero
// banner image. Rejects anything that would look broken or bloat storage.
//
// The reference banner is 2560x1086 (aspect ~2.357). We validate against
// that shape with some tolerance, rather than requiring an exact pixel
// match — strict enough to guarantee it looks right, loose enough that a
// reasonably-sized export from any design tool will pass.
// ============================================================================

export const HERO_MIN_WIDTH = 1600;
export const HERO_ASPECT_TARGET = 2560 / 1086;
export const HERO_ASPECT_TOLERANCE = 0.15; // accepts ~2.21 to ~2.51
export const HERO_MAX_DATA_URL_LENGTH = 2_800_000; // ~2MB of raw image data, base64-encoded

export function validateHero(image) {
  if (!image || typeof image !== "object") return "No image data received.";
  if (typeof image.dataUrl !== "string" || !image.dataUrl.startsWith("data:image/")) {
    return "That doesn't look like a valid image.";
  }
  if (image.dataUrl.length > HERO_MAX_DATA_URL_LENGTH) {
    return "Image file is too large — please use a more compressed export (under ~2MB).";
  }
  const width = Number(image.width);
  const height = Number(image.height);
  if (!width || !height) return "Couldn't read the image's dimensions.";
  if (width < HERO_MIN_WIDTH) {
    return `Image is too small — needs to be at least ${HERO_MIN_WIDTH}px wide (yours is ${width}px).`;
  }
  const aspect = width / height;
  if (Math.abs(aspect - HERO_ASPECT_TARGET) > HERO_ASPECT_TOLERANCE) {
    return `Image proportions are off — needs to be a wide banner shape (around ${HERO_ASPECT_TARGET.toFixed(2)}:1, like 2560×1086). Yours is ${aspect.toFixed(2)}:1.`;
  }
  return null;
}
