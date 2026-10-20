// ============================================================================
// Ovi's Fix — /api/admin/login (Vercel Serverless Function)
//
// Single-admin password check. Not a multi-user auth system — appropriate
// for one shop owner protecting his own settings page, nothing more.
//
// This one function also answers /api/admin/check and /api/admin/logout (vercel.json
// rewrites them to ?action=check / ?action=logout). Vercel's free plan allows only
// 12 serverless functions, so related endpoints share a file.
//
// Env vars required:
//   ADMIN_PASSWORD   the password you type into the admin login page
//   AUTH_SECRET      any long random string, used to sign session cookies
//                     (e.g. generate one with: openssl rand -hex 32)
// ============================================================================

import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "../../lib/session.js";
import { buildSetCookie, parseCookie } from "../../lib/cookies.js";
import { constantTimeEqual } from "../../lib/crypto-utils.js";
import { kvIncrWithTtl } from "../../lib/upstash.js";

export default async function handler(req, res) {
  const action = req.query?.action || "login";

  // /api/admin/check — does the browser hold a valid session cookie?
  if (action === "check") {
    const secret = process.env.AUTH_SECRET;
    const token = parseCookie(req.headers.cookie, SESSION_COOKIE_NAME);
    const valid = secret ? await verifySessionToken(token, secret) : false;
    return res.status(valid ? 200 : 401).json({ authenticated: valid });
  }
  // /api/admin/logout — clear the session cookie
  if (action === "logout") {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }
    res.setHeader("Set-Cookie", buildSetCookie(SESSION_COOKIE_NAME, "", 0));
    return res.status(200).json({ success: true });
  }

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

  // Brute-force guard: at most 8 attempts per IP per 15 minutes (skipped if Redis isn't set up).
  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim().slice(0, 64);
  const attempts = await kvIncrWithTtl(process.env, `ovisfix:rl:login:${ip}`, 900);
  if (attempts !== null && attempts > 8) {
    return res.status(429).json({ success: false, error: "Too many attempts. Please wait 15 minutes and try again." });
  }

  const supplied = (body.password || "").toString();
  if (!constantTimeEqual(supplied, adminPassword)) {
    return res.status(401).json({ success: false, error: "Incorrect password." });
  }

  const token = await createSessionToken(authSecret);
  res.setHeader("Set-Cookie", buildSetCookie(SESSION_COOKIE_NAME, token, SESSION_MAX_AGE_SECONDS));
  return res.status(200).json({ success: true });
}
