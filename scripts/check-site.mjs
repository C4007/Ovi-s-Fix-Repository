#!/usr/bin/env node
/* ==========================================================================
   Ovi's Fix — scripts/check-site.mjs   (run with:  npm run check)
   Quick health check you can run after editing the catalog or the code:
     • starter products / pre-built PCs / offers / store settings pass the same rules the server uses
     • every spec used by a product exists for its category, every pre-built PC part exists
     • every page in the shop menu has its HTML file (run `npm run pages` if one is missing)
     • every text key used in the code exists in English AND Bangla
     • the api/ folder stays within Vercel's 12-function limit (free plan)
   ========================================================================== */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = (p) => new URL(`file://${path.join(ROOT, p)}`).href;
const { seedProducts, seedBuilds, seedOffers, seedStore } = await import(url("js/shop-seed.js"));
const { SUBS, CATEGORIES, BUILDER_ROWS } = await import(url("js/catalog-schema.js"));
const V = await import(url("lib/validate-shop.js"));
const { translations } = await import(url("js/translations.js"));
await import(url("js/i18n-shop.js"));

let problems = 0;
const bad = (msg) => { problems++; console.log("  ✗", msg); };
const ok = (msg) => console.log("  ✓", msg);

console.log("Catalog data");
for (const [name, err] of [["products", V.validateProducts(seedProducts)], ["pre-built PCs", V.validateBuilds(seedBuilds)], ["offers", V.validateOffers(seedOffers)], ["store settings", V.validateStore(seedStore)]]) {
  err ? bad(`${name}: ${err}`) : ok(`${name} are valid`);
}
const ids = new Set(seedProducts.map((p) => p.id));
for (const b of seedBuilds) for (const part of b.parts) if (!ids.has(part.id)) bad(`pre-built PC "${b.id}" uses a product that does not exist: ${part.id}`);
for (const p of seedProducts) for (const k of Object.keys(p.specs)) if (!SUBS[p.sub].filters.some((f) => f.key === k)) bad(`${p.id}: "${k}" is not a spec of ${p.sub}`);
const listed = Object.values(CATEGORIES).flatMap((c) => c.subs);
for (const s of Object.keys(SUBS)) if (!listed.includes(s)) bad(`sub-category "${s}" is not listed in any category`);
for (const r of BUILDER_ROWS) for (const s of r.subs) if (!SUBS[s]) bad(`PC Builder row "${r.key}" points at unknown category "${s}"`);
ok(`${seedProducts.length} products, ${Object.keys(SUBS).length} sub-categories`);

console.log("Pages");
const need = ["home.html", "service.html", "terms.html", "admin.html", "components.html", "pc-builder.html", "builds.html", "offers.html", "cart.html", "product.html", "404.html", "shop/index.html"];
for (const [cat, c] of Object.entries(CATEGORIES)) { need.push(`shop/${cat}.html`); for (const s of c.subs) need.push(`shop/${cat}/${s}.html`); }
const missing = need.filter((f) => !fs.existsSync(path.join(ROOT, f)));
missing.length ? bad(`missing pages (run "npm run pages"): ${missing.join(", ")}`) : ok(`all ${need.length} pages exist`);

console.log("Text (English + Bangla)");
const keys = new Set();
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const files = [...walk(path.join(ROOT, "js")), ...fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).map((f) => path.join(ROOT, f))];
for (const f of files) {
  if (/(translations|data|i18n-shop|shop-seed|catalog-schema|language)\.js$/.test(f)) continue;
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/\bT\(\s*"([a-zA-Z0-9_.]+)"/g)) keys.add(m[1]);
  for (const m of src.matchAll(/data-i18n(?:-aria|-placeholder)?="([a-zA-Z0-9_.]+)"/g)) keys.add(m[1]);
}
["featured", "price-asc", "price-desc", "newest", "discount"].forEach((s) => keys.add(`shop.sort.${s}`));
const get = (o, p) => p.split(".").reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), o);
let missingText = 0;
for (const lang of ["en", "bn"]) for (const k of keys) if (typeof get(translations[lang], k) !== "string") { bad(`missing ${lang} text: ${k}`); missingText++; }
if (!missingText) ok(`${keys.size} text keys found in both languages`);

console.log("Hosting");
const fnCount = walk(path.join(ROOT, "api")).filter((f) => f.endsWith(".js")).length;
fnCount > 12 ? bad(`api/ has ${fnCount} functions — Vercel's free plan allows 12`) : ok(`api/ has ${fnCount} of 12 allowed functions`);

console.log(problems ? `\n${problems} problem(s) found.` : "\nAll good.");
process.exit(problems ? 1 : 0);
