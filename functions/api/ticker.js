// ============================================================================
// Ovi's Fix — /api/ticker (Cloudflare Pages Function)
// Mirrors api/ticker.js.
// ============================================================================

import { getStoredTicker } from "../../lib/ticker-store.js";

export async function onRequestGet(context) {
  const result = await getStoredTicker(context.env);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
