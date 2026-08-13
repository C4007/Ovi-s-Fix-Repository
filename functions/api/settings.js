// ============================================================================
// Ovi's Fix — /api/settings (Cloudflare Pages Function)
// Mirrors api/settings.js.
// ============================================================================

import { getStoredSettings } from "../../lib/settings-store.js";

export async function onRequestGet(context) {
  const result = await getStoredSettings(context.env);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
