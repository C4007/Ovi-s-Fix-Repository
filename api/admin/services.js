// ============================================================================
// Ovi's Fix — /api/admin/services (Vercel Serverless Function)
// Authenticated write path: overwrites the entire stored services array.
// The admin UI manages the full list client-side and saves it as one unit —
// simpler and more robust than per-item CRUD for a ~20-item list.
// ============================================================================

import { verifySessionToken, SESSION_COOKIE_NAME } from "../../lib/session.js";
import { parseCookie } from "../../lib/cookies.js";
import { saveServices } from "../../lib/services-store.js";
import { validateServices } from "../../lib/validate-services.js";

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

  const validationError = validateServices(body.services);
  if (validationError) return res.status(400).json({ success: false, error: validationError });

  const result = await saveServices(process.env, body.services);
  if (!result.ok) {
    return res.status(500).json({
      success: false,
      error: "Could not save — check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set correctly.",
    });
  }

  return res.status(200).json({ success: true });
}
