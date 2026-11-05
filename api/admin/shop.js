// ============================================================================
// Ovi's Fix — /api/admin/shop (Vercel Serverless Function)
// Authenticated write path.
//   /api/admin/shop   body { key: "products"|"builds"|"offers"|"store", data }
//   /api/admin/image  body { id, dataUrl } to save a photo, or { id, remove: true }
//                     (vercel.json rewrites it to /api/admin/shop?kind=image — Vercel's free plan
//                     allows only 12 serverless functions, so both share this file)
// ============================================================================

import { verifySessionToken, SESSION_COOKIE_NAME } from "../../lib/session.js";
import { parseCookie } from "../../lib/cookies.js";
import { saveShopKey } from "../../lib/shop-store.js";
import { saveImage, deleteImage } from "../../lib/image-store.js";
import { SHOP_VALIDATORS } from "../../lib/validate-shop.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const authSecret = process.env.AUTH_SECRET;
  const token = parseCookie(req.headers.cookie, SESSION_COOKIE_NAME);
  const valid = authSecret ? await verifySessionToken(token, authSecret) : false;
  if (!valid) return res.status(401).json({ success: false, error: "Not authenticated." });

  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch (err) {
      return res.status(400).json({ success: false, error: "Invalid request body" });
    }
  }

  if (req.query?.kind === "image") {
    if (body.remove) {
      await deleteImage(process.env, body.id);
      return res.status(200).json({ success: true });
    }
    const saved = await saveImage(process.env, body.id, body.dataUrl);
    if (!saved.ok) return res.status(400).json({ success: false, error: saved.error });
    return res.status(200).json({ success: true, url: `/api/image?id=${encodeURIComponent(body.id)}&v=${Date.now()}` });
  }

  const validate = SHOP_VALIDATORS[body.key];
  if (!validate) return res.status(400).json({ success: false, error: "Unknown data set." });
  const validationError = validate(body.data);
  if (validationError) return res.status(400).json({ success: false, error: validationError });

  const result = await saveShopKey(process.env, body.key, body.data);
  if (!result.ok) {
    return res.status(500).json({
      success: false,
      error: "Could not save — check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set correctly.",
    });
  }
  return res.status(200).json({ success: true });
}
