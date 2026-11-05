// Ovi's Fix — /api/image?id=... (Cloudflare Pages Function). Mirrors api/image.js.
import { getImage } from "../../lib/image-store.js";

export async function onRequestGet(context) {
  const id = new URL(context.request.url).searchParams.get("id") || "";
  const img = await getImage(context.env, id);
  if (!img) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(img.bytes, {
    status: 200,
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
