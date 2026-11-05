// Ovi's Fix — /api/admin/shop (Cloudflare Pages Function). Mirrors api/admin/shop.js.
import { verifySessionToken, SESSION_COOKIE_NAME } from "../../../lib/session.js";
import { parseCookie } from "../../../lib/cookies.js";
import { saveShopKey } from "../../../lib/shop-store.js";
import { SHOP_VALIDATORS } from "../../../lib/validate-shop.js";

function json(data, status) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
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

  const validate = SHOP_VALIDATORS[body.key];
  if (!validate) return json({ success: false, error: "Unknown data set." }, 400);
  const validationError = validate(body.data);
  if (validationError) return json({ success: false, error: validationError }, 400);

  const result = await saveShopKey(env, body.key, body.data);
  if (!result.ok) {
    return json({ success: false, error: "Could not save — check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set correctly." }, 500);
  }
  return json({ success: true }, 200);
}
