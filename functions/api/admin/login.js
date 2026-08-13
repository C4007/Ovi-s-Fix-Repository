// ============================================================================
// Ovi's Fix — /api/admin/login (Cloudflare Pages Function)
// Mirrors api/admin/login.js. See that file for the full explanation.
// ============================================================================

import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "../../../lib/session.js";
import { buildSetCookie } from "../../../lib/cookies.js";
import { constantTimeEqual } from "../../../lib/crypto-utils.js";

function json(data, status, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const adminPassword = env.ADMIN_PASSWORD;
  const authSecret = env.AUTH_SECRET;
  if (!adminPassword || !authSecret) {
    return json(
      { success: false, error: "Admin login isn't configured yet. Set ADMIN_PASSWORD and AUTH_SECRET — see README.md." },
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return json({ success: false, error: "Invalid request body" }, 400);
  }

  const supplied = (body.password || "").toString();
  if (!constantTimeEqual(supplied, adminPassword)) {
    return json({ success: false, error: "Incorrect password." }, 401);
  }

  const token = await createSessionToken(authSecret);
  return json(
    { success: true },
    200,
    { "Set-Cookie": buildSetCookie(SESSION_COOKIE_NAME, token, SESSION_MAX_AGE_SECONDS) }
  );
}
