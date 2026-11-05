// ============================================================================
// Ovi's Fix — /api/settings (Vercel Serverless Function)
// Public, read-only. Mirrors api/services.js / api/ticker.js / api/hero.js.
// ============================================================================

import { getStoredSettings } from "../lib/settings-store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ settings: null, source: "method-not-allowed" });
  }

  const result = await getStoredSettings(process.env);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(result);
}
