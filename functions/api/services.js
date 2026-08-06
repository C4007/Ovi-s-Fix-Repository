// ============================================================================
// Ovi's Fix — /api/services (Cloudflare Pages Function)
// Mirrors api/services.js. See that file for the full explanation.
// ============================================================================

import { getStoredServices } from "../../lib/services-store.js";

export async function onRequestGet(context) {
  const result = await getStoredServices(context.env);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
