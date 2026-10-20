#!/usr/bin/env node
/* ==========================================================================
   Ovi's Fix — scripts/dev-server.mjs   (run with:  npm run dev)
   A local copy of the live site for testing, with NO accounts needed:
     • serves the pages with the same clean URLs as Vercel / Cloudflare (/shop, /pc-builder …)
     • runs the real /api/* functions from the api/ folder
     • keeps products, offers, photos etc. in a small local file (.dev-data.json)
       instead of Upstash, so you can try the admin panel safely.
   Admin login on this local server:  password  "dev"   (change with ADMIN_PASSWORD in .env)
   ========================================================================== */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = path.join(ROOT, ".dev-data.json");

/* .env (optional) */
try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !line.trim().startsWith("#") && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch (e) { /* no .env — fine */ }
process.env.ADMIN_PASSWORD ||= "dev";
process.env.AUTH_SECRET ||= "dev-only-secret-change-me-0123456789abcdef";
if (!process.env.UPSTASH_REDIS_REST_URL) {
  process.env.UPSTASH_REDIS_REST_URL = `http://localhost:${PORT}/__kv`;
  process.env.UPSTASH_REDIS_REST_TOKEN = "dev";
}

/* ---- tiny in-memory Redis (REST-compatible subset) saved to .dev-data.json ---- */
let kv = {};
try { kv = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch (e) { kv = {}; }
const save = () => { try { fs.writeFileSync(DATA_FILE, JSON.stringify(kv)); } catch (e) { /* ignore */ } };

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}
const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

async function kvRoute(req, res, parts) {
  const cmd = (parts[0] || "").toLowerCase();
  const dec = (s) => decodeURIComponent(s);
  if (cmd === "get") return json(res, 200, { result: kv[dec(parts[1])] ?? null });
  if (cmd === "mget") return json(res, 200, { result: parts.slice(1).map((k) => kv[dec(k)] ?? null) });
  if (cmd === "set") { kv[dec(parts[1])] = await readBody(req); save(); return json(res, 200, { result: "OK" }); }
  if (cmd === "del") { delete kv[dec(parts[1])]; save(); return json(res, 200, { result: 1 }); }
  if (cmd === "pipeline") {
    const ops = JSON.parse(await readBody(req));
    return json(res, 200, ops.map(([op, key]) => (op.toUpperCase() === "INCR" ? { result: (kv[key] = String((Number(kv[key]) || 0) + 1)) && Number(kv[key]) } : { result: 1 })));
  }
  return json(res, 404, { error: "unsupported" });
}

/* vercel.json "rewrites" (e.g. /api/image → /api/shop?kind=image) so local behaves like the live site */
let rewrites = [];
try { rewrites = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")).rewrites || []; } catch (e) { rewrites = []; }
function applyRewrite(url) {
  const hit = rewrites.find((r) => r.source === url.pathname);
  if (!hit) return url;
  const dest = new URL(hit.destination, url.origin);
  for (const [k, v] of url.searchParams) dest.searchParams.set(k, v);
  return dest;
}

/* ---- run the Vercel-style handlers in api/ ---- */
async function runApi(req, res, url) {
  url = applyRewrite(url);
  const rel = url.pathname.replace(/^\/api\//, "").replace(/\/$/, "");
  const file = path.join(ROOT, "api", `${rel}.js`);
  if (!rel || rel.includes("..") || !fs.existsSync(file)) return json(res, 404, { error: "Not found" });
  const mod = await import(pathToFileURL(file).href);
  const raw = req.method === "GET" || req.method === "HEAD" ? "" : await readBody(req);
  let body = raw;
  if ((req.headers["content-type"] || "").includes("application/json")) { try { body = JSON.parse(raw || "{}"); } catch (e) { body = raw; } }
  req.body = body;
  req.query = Object.fromEntries(url.searchParams.entries());
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { if (!res.getHeader("Content-Type")) res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); return res; };
  res.send = (b) => { res.end(b); return res; };
  await mod.default(req, res);
}

/* ---- static files with clean URLs ---- */
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf" };
function resolveFile(p) {
  const clean = decodeURIComponent(p).replace(/\/+$/, "") || "/";
  const base = path.join(ROOT, clean);
  if (!base.startsWith(ROOT)) return null;
  for (const c of [base, `${base}.html`, path.join(base, "index.html")]) {
    try { if (fs.statSync(c).isFile()) return c; } catch (e) { /* next */ }
  }
  return null;
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname.startsWith("/__kv/")) return await kvRoute(req, res, url.pathname.slice(6).split("/"));
    if (url.pathname.startsWith("/api/")) return await runApi(req, res, url);
    if (url.pathname === "/") { res.writeHead(302, { Location: "/home" + url.search }); return res.end(); }
    const file = resolveFile(url.pathname);
    if (!file || /\/(\.|node_modules|lib\/|api\/|functions\/|scripts\/)/.test(url.pathname) || url.pathname.startsWith("/.")) {
      const nf = resolveFile("/home");
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(nf ? "<h1>404 — page not found</h1><p><a href='/home'>Go home</a></p>" : "404");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) json(res, 500, { error: String(err.message || err) });
  }
}).listen(PORT, () => {
  console.log(`\n  Ovi's Fix is running at  http://localhost:${PORT}`);
  console.log(`  Admin panel:             http://localhost:${PORT}/admin   (password: ${process.env.ADMIN_PASSWORD})`);
  console.log(`  Data is saved in .dev-data.json (delete it to start fresh)\n`);
});
