// ============================================================================
// Ovi's Fix — /api/hero (Vercel Serverless Function)
// Public, read-only. Mirrors api/services.js / api/ticker.js.
// ============================================================================

import { getStoredHero } from "../lib/hero-store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ image: null, source: "method-not-allowed" });
  }

  const result = await getStoredHero(process.env);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(result);
}
