#!/usr/bin/env node
/* ==========================================================================
   Ovi's Fix — scripts/build-pages.mjs
   Writes the small HTML "shells" for the shop pages (every page is one tiny
   file that loads its own JavaScript module):

     home.html  components.html  product.html  pc-builder.html  builds.html
     offers.html  cart.html  404.html  index.html (redirects to /home)
     shop/index.html                      → /shop
     shop/<category>.html                 → /shop/components, /shop/laptops …
     shop/<category>/<sub-category>.html  → /shop/components/processor …

   Run it again after you add a category or sub-category in js/catalog-schema.js:
       node scripts/build-pages.mjs
   ========================================================================== */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES, SUBS } from "../js/catalog-schema.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const THEME_SCRIPT = `<script>
(function () {
  try {
    var stored = localStorage.getItem('ovisfix-theme');
    var theme = (stored === 'light' || stored === 'dark') ? stored : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) { document.documentElement.setAttribute('data-theme', 'light'); }
})();
</script>`;

function shell({ title, desc, page, module, attrs = "" }) {
  const t = esc(title);
  const d = esc(desc);
  return `<!DOCTYPE html>
<html lang="en" data-custom-title>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t}</title>
<meta name="description" content="${d}">
<meta name="theme-color" content="#0b1b33">
<meta property="og:type" content="website">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<!-- TODO: once deployed, point this at the full https://yourdomain.com/images/logo.jpg -->
<meta property="og:image" content="/images/logo.jpg">
<link rel="icon" href="/images/favicon/favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="/images/favicon/favicon-32.png" sizes="32x32">
<link rel="icon" type="image/png" href="/images/favicon/favicon-192.png" sizes="192x192">
<link rel="apple-touch-icon" href="/images/favicon/favicon-180.png">
${THEME_SCRIPT}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/fonts-generated.css">
<link rel="stylesheet" href="/css/variables.css">
<link rel="stylesheet" href="/css/base.css">
<link rel="stylesheet" href="/css/components.css">
<link rel="stylesheet" href="/css/animations.css">
<link rel="stylesheet" href="/css/responsive.css">
<link rel="stylesheet" href="/css/shop.css">
</head>
<body data-page="${page}"${attrs}>
<a class="skip-link" href="#main">Skip to content</a>
<div id="app-header"></div>
<main id="main" class="page"><div id="page-root"></div><noscript><p class="container" style="padding:40px 24px">Please turn on JavaScript to browse the shop.</p></noscript></main>
<div id="app-footer"></div>
<script type="module" src="/js/pages/${module}.js"></script>
</body>
</html>
`;
}

function write(rel, html) {
  const file = join(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log("  wrote", rel);
}

const SITE = "Ovi's Fix";
write("home.html", shell({ title: `${SITE} — Computer parts, PC builder & repair in Dhaka`, desc: "Build your PC online with free service charge, buy computer parts and pre-built PCs, or book computer repair in Keraniganj, Dhaka.", page: "home", module: "home" }));
write("components.html", shell({ title: `Components — stock & price list — ${SITE}`, desc: "Every product we stock or can pre-order, with current prices in BDT.", page: "components", module: "components" }));
write("product.html", shell({ title: `Product — ${SITE}`, desc: "Product details and specifications.", page: "product", module: "product" }));
write("pc-builder.html", shell({ title: `PC Builder (Beta) — ${SITE}`, desc: "Pick compatible parts, see the estimated wattage and CPU/GPU balance. Service charge is free on PCs built from this website.", page: "builder", module: "builder" }));
write("builds.html", shell({ title: `Pre-built PCs — ${SITE}`, desc: "Budget-friendly pre-configured PCs. Order as they are or customize in the PC Builder.", page: "builds", module: "builds" }));
write("offers.html", shell({ title: `Offers & discounts — ${SITE}`, desc: "Current offers and discounted products.", page: "offers", module: "offers" }));
write("cart.html", shell({ title: `Cart — ${SITE}`, desc: "Review your items and order on WhatsApp.", page: "cart", module: "cart" }));
write("shop/index.html", shell({ title: `Shop — ${SITE}`, desc: "Computer parts, laptops, monitors and accessories with honest prices.", page: "shop", module: "shop" }));

let count = 0;
for (const [cat, c] of Object.entries(CATEGORIES)) {
  write(`shop/${cat}.html`, shell({ title: `${c.label.en} — ${SITE}`, desc: c.blurb.en, page: "shop", module: "shop", attrs: ` data-cat="${cat}"` }));
  for (const sub of c.subs) {
    write(`shop/${cat}/${sub}.html`, shell({ title: `${SUBS[sub].label.en} — ${c.label.en} — ${SITE}`, desc: `${SUBS[sub].label.en} — ${c.blurb.en}`, page: "shop", module: "shop", attrs: ` data-cat="${cat}"` }));
    count++;
  }
}

write("404.html", shell({ title: `Page not found — ${SITE}`, desc: "This page could not be found.", page: "notfound", module: "notfound" }));
write("index.html", `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${SITE}</title>
<meta http-equiv="refresh" content="0; url=/home"><link rel="canonical" href="/home">
<script>location.replace('/home' + location.search + location.hash);</script>
</head><body><p><a href="/home">Continue to ${SITE}</a></p></body></html>
`);
console.log(`Done — ${count} sub-category pages.`);
