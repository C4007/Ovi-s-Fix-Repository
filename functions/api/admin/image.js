// Ovi's Fix — /api/admin/image (Cloudflare Pages Function). Mirrors api/admin/image.js.
import { verifySessionToken, SESSION_COOKIE_NAME } from "../../../lib/session.js";
import { parseCookie } from "../../../lib/cookies.js";
import { saveImage, deleteImage } from "../../../lib/image-store.js";

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

  if (body.remove) {
    await deleteImage(env, body.id);
    return json({ success: true }, 200);
  }
  const result = await saveImage(env, body.id, body.dataUrl);
  if (!result.ok) return json({ success: false, error: result.error }, 400);
  return json({ success: true, url: `/api/image?id=${encodeURIComponent(body.id)}&v=${Date.now()}` }, 200);
}
