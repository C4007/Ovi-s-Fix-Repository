// ============================================================================
// Ovi's Fix — /api/admin/settings (Cloudflare Pages Function)
// Mirrors api/admin/settings.js.
// ============================================================================

import { verifySessionToken, SESSION_COOKIE_NAME } from "../../../lib/session.js";
import { parseCookie } from "../../../lib/cookies.js";
import { saveSettings } from "../../../lib/settings-store.js";
import { validateSettings } from "../../../lib/validate-settings.js";

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const authSecret = env.AUTH_SECRET;
  const token = parseCookie(request.headers.get("Cookie"), SESSION_COOKIE_NAME);
  const valid = authSecret ? await verifySessionToken(token, authSecret) : false;
  if (!valid) return json({ success: false, error: "Not authenticated." }, 401);

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return json({ success: false, error: "Invalid request body" }, 400);
  }

  const validationError = validateSettings(body.settings);
  if (validationError) return json({ success: false, error: validationError }, 400);

  const result = await saveSettings(env, { ...body.settings, updatedAt: Date.now() });
  if (!result.ok) {
    return json(
      { success: false, error: "Could not save — check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set correctly." },
      500
    );
  }

  return json({ success: true }, 200);
}
