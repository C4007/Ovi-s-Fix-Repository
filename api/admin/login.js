// ============================================================================
// Ovi's Fix — /api/admin/login (Vercel Serverless Function)
//
// Single-admin password check. Not a multi-user auth system — appropriate
// for one shop owner protecting his own settings page, nothing more.
//
// Env vars required:
//   ADMIN_PASSWORD   the password you type into the admin login page
//   AUTH_SECRET      any long random string, used to sign session cookies
//                     (e.g. generate one with: openssl rand -hex 32)
// ============================================================================

import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "../../lib/session.js";
import { buildSetCookie } from "../../lib/cookies.js";
import { constantTimeEqual } from "../../lib/crypto-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const authSecret = process.env.AUTH_SECRET;
  if (!adminPassword || !authSecret) {
    return res.status(500).json({
      success: false,
      error: "Admin login isn't configured yet. Set ADMIN_PASSWORD and AUTH_SECRET — see README.md.",
    });
  }

  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch (err) {
      return res.status(400).json({ success: false, error: "Invalid request body" });
    }
  }

  const supplied = (body.password || "").toString();
  if (!constantTimeEqual(supplied, adminPassword)) {
    return res.status(401).json({ success: false, error: "Incorrect password." });
  }

  const token = await createSessionToken(authSecret);
  res.setHeader("Set-Cookie", buildSetCookie(SESSION_COOKIE_NAME, token, SESSION_MAX_AGE_SECONDS));
  return res.status(200).json({ success: true });
}
