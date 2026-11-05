// Ovi's Fix — POST /api/assistant (Cloudflare Pages Function). Mirrors the assistant branch of api/shop.js.
import { runAssistant } from "../../lib/assistant.js";

export async function onRequestPost(context) {
  let body = null;
  try { body = await context.request.json(); } catch (err) { body = null; }
  const ip = (context.request.headers.get("CF-Connecting-IP") || "unknown").slice(0, 64);
  const out = await runAssistant(context.env, body, { ip });
  return new Response(JSON.stringify(out.body), { status: out.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
