// ============================================================================
// Ovi's Fix — /api/admin/settings (Vercel Serverless Function)
// Authenticated write path for site-wide appearance settings. Mirrors
// api/admin/hero.js — see that file for the fuller auth-flow explanation.
// ============================================================================

import { verifySessionToken, SESSION_COOKIE_NAME } from "../../lib/session.js";
import { parseCookie } from "../../lib/cookies.js";
import { saveSettings } from "../../lib/settings-store.js";
import { validateSettings } from "../../lib/validate-settings.js";

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

  const validationError = validateSettings(body.settings);
  if (validationError) return res.status(400).json({ success: false, error: validationError });

  const result = await saveSettings(process.env, { ...body.settings, updatedAt: Date.now() });
  if (!result.ok) {
    return res.status(500).json({
      success: false,
      error: "Could not save — check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set correctly.",
    });
  }

  return res.status(200).json({ success: true });
}
