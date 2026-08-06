// ============================================================================
// Ovi's Fix — /api/admin/check (Vercel Serverless Function)
// The admin page calls this on load to decide: show the login form, or the
// dashboard? Returns 200 if the session cookie is present and valid, 401
// otherwise. Doesn't leak anything about the cookie's contents.
// ============================================================================

import { verifySessionToken, SESSION_COOKIE_NAME } from "../../lib/session.js";
import { parseCookie } from "../../lib/cookies.js";

export default async function handler(req, res) {
  const authSecret = process.env.AUTH_SECRET;
  const token = parseCookie(req.headers.cookie, SESSION_COOKIE_NAME);
  const valid = authSecret ? await verifySessionToken(token, authSecret) : false;

  if (!valid) return res.status(401).json({ authenticated: false });
  return res.status(200).json({ authenticated: true });
}
