// ============================================================================
// Ovi's Fix — /api/ticker (Vercel Serverless Function)
// Public, read-only. Mirrors api/services.js — see that file for the fuller
// explanation of the fallback behavior.
// ============================================================================

import { getStoredTicker } from "../lib/ticker-store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ lines: [], source: "method-not-allowed" });
  }

  const result = await getStoredTicker(process.env);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(result);
}
