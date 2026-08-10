// ============================================================================
// Ovi's Fix — /api/admin/hero (Vercel Serverless Function)
// Authenticated write path for the hero banner image. Mirrors
// api/admin/services.js / api/admin/ticker.js — see those for the fuller
// explanation of the auth flow.
// ============================================================================

import { verifySessionToken, SESSION_COOKIE_NAME } from "../../lib/session.js";
import { parseCookie } from "../../lib/cookies.js";
import { saveHero } from "../../lib/hero-store.js";
import { validateHero } from "../../lib/validate-hero.js";

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

  const validationError = validateHero(body.image);
  if (validationError) return res.status(400).json({ success: false, error: validationError });

  const result = await saveHero(process.env, { ...body.image, updatedAt: Date.now() });
  if (!result.ok) {
    return res.status(500).json({
      success: false,
      error: "Could not save — check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set correctly.",
    });
  }

  return res.status(200).json({ success: true });
}
