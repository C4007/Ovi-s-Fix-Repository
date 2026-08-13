// ============================================================================
// Ovi's Fix — /api/admin/logout (Vercel Serverless Function)
// ============================================================================

import { SESSION_COOKIE_NAME } from "../../lib/session.js";
import { buildSetCookie } from "../../lib/cookies.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
  res.setHeader("Set-Cookie", buildSetCookie(SESSION_COOKIE_NAME, "", 0));
  return res.status(200).json({ success: true });
}
