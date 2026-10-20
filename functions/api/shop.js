// Ovi's Fix — /api/shop (Cloudflare Pages Function). Mirrors api/shop.js.
import { getShopData } from "../../lib/shop-store.js";

export async function onRequestGet(context) {
  const data = await getShopData(context.env);
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
