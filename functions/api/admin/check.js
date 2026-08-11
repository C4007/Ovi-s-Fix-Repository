// ============================================================================
// Ovi's Fix — /api/admin/check (Cloudflare Pages Function)
// Mirrors api/admin/check.js.
// ============================================================================

import { verifySessionToken, SESSION_COOKIE_NAME } from "../../../lib/session.js";
import { parseCookie } from "../../../lib/cookies.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const authSecret = env.AUTH_SECRET;
  const token = parseCookie(request.headers.get("Cookie"), SESSION_COOKIE_NAME);
  const valid = authSecret ? await verifySessionToken(token, authSecret) : false;

  return new Response(JSON.stringify({ authenticated: valid }), {
    status: valid ? 200 : 401,
    headers: { "Content-Type": "application/json" },
  });
}
