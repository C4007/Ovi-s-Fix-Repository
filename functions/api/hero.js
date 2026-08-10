// ============================================================================
// Ovi's Fix — /api/hero (Cloudflare Pages Function)
// Mirrors api/hero.js.
// ============================================================================

import { getStoredHero } from "../../lib/hero-store.js";

export async function onRequestGet(context) {
  const result = await getStoredHero(context.env);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
