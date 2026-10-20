// ============================================================================
// Ovi's Fix — /api/shop (Vercel Serverless Function)
// Public, read-only.
//   /api/shop              → products, pre-built PCs, offers and store settings in one response.
//                            Any key not saved from the admin panel yet comes back as null, and the
//                            browser falls back to the starter data in js/shop-seed.js.
//   /api/image?id=...      → a product / pre-built PC photo (vercel.json rewrites it to
//                            /api/shop?kind=image). The URL carries ?v=timestamp, so each version
//                            can be cached for a year. Photos share this file because Vercel's
//                            free plan allows only 12 serverless functions.
// ============================================================================

import { getShopData } from "../lib/shop-store.js";
import { getImage } from "../lib/image-store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ source: "method-not-allowed" });
  }

  if (req.query?.kind === "image") {
    const img = await getImage(process.env, String(req.query.id || ""));
    if (!img) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(404).end();
    }
    res.setHeader("Content-Type", img.mime);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).end(Buffer.from(img.bytes));
  }

  const data = await getShopData(process.env);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(data);
}
