// ============================================================================
// Ovi's Fix — /api/services (Vercel Serverless Function)
// Public, read-only. Returns whatever is currently stored in Upstash. If
// Upstash isn't configured yet (or the read fails), returns an empty array
// with a `source` flag — the frontend (js/render.js) falls back to the
// bundled default services in js/data.js when it sees that, so the public
// site never breaks just because the admin panel hasn't been set up yet.
// ============================================================================

import { getStoredServices } from "../lib/services-store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ services: [], source: "method-not-allowed" });
  }

  const result = await getStoredServices(process.env);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(result);
}
