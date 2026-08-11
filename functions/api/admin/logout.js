// ============================================================================
// Ovi's Fix — /api/admin/logout (Cloudflare Pages Function)
// ============================================================================

import { SESSION_COOKIE_NAME } from "../../../lib/session.js";
import { buildSetCookie } from "../../../lib/cookies.js";

export async function onRequestPost() {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": buildSetCookie(SESSION_COOKIE_NAME, "", 0),
    },
  });
}
