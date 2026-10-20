# Ovi's Fix — website

Computer shop, PC Builder and repair service for **Ovi's Fix** (Barisur, Keraniganj, Dhaka).
Plain HTML, CSS and JavaScript — **no build step** — plus a few small serverless functions for the
admin panel, saved data (Upstash Redis) and the contact form. Works in English and Bangla, light and dark.

## Pages

| Link | What it is |
| --- | --- |
| `/` → `/home` | New landing page: Shop or Service, the free-service promise, a live example build sheet, categories, PC Builder, pre-built PCs, offers |
| `/shop` | Shop home: categories, offers, pre-built PCs, popular picks |
| `/shop/components`, `/shop/laptops`, `/shop/monitors`, `/shop/accessories`, `/shop/networking`, `/shop/power`, `/shop/software` | One page per category, with sub-category chips |
| `/shop/components/processor`, `/shop/components/ssd`, … | One page per sub-category (26 in total), each with its own filters |
| `/components` | **Stock & price list**: everything you stock or can pre-order, in one searchable, printable table |
| `/pc-builder` | **PC Builder (Beta)**: motherboard first, fit checks, estimated wattage, CPU/GPU balance, save / print / image |
| `/builds` | Pre-built budget PCs with photos |
| `/offers` | Offers, perks and every discounted product |
| `/product?id=…` | One product with specs |
| `/cart` | Cart → order on WhatsApp or send an order request |
| `/service` | The original repair-service site (hero, services, compare, why us, FAQ, contact) |
| `/terms` | Terms & conditions (now with shop, pre-order and PC Builder terms) |
| `/admin` | Admin panel |

## Run it on your computer

```bash
npm run dev        # http://localhost:3000   (needs Node 18+, nothing to install)
```

This starts a local copy of the live site. Products, offers and photos you save in the admin panel are kept
in a small file, `.dev-data.json` (delete it to start fresh). **Admin password on your computer: `dev`.**

Other commands: `npm run pages` (rebuild the page files after adding a category) and
`npm run check` (health check: data, pages, English + Bangla text, function count).

## Put it online

The site runs on **Vercel** or **Cloudflare Pages**. Set these in the host's *Environment Variables* (see `.env.example`):

| Name | What it is |
| --- | --- |
| `ADMIN_PASSWORD` | The admin login password — choose a long one |
| `AUTH_SECRET` | A long random string (32+ characters) used to sign the login cookie |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Free database from <https://upstash.com> — stores products, offers, photos, services, ticker |
| `RESEND_API_KEY`, `TO_EMAIL`, `FROM_EMAIL` | Optional — emails for the contact form and "Send order request" |

**Vercel:** import the project, add the variables, deploy. (`vercel.json` already sets clean links, the `/` → `/home`
redirect and four URL rewrites.) The free Vercel plan allows **12 serverless functions** — this project uses exactly 12,
which is why the photo and session endpoints share files with related ones. Keep that in mind before adding new files to `api/`
(`npm run check` warns you).
**Cloudflare Pages:** no build command, output directory `/`. The `functions/` folder and `_redirects` are already set up.

**First time after deploying:** open `/admin` → **Overview** → **Save starter data to my database**. After that, everything is
editable. Until then the site shows the starter catalog that ships in `js/shop-seed.js`.

Before launch, also set the real domain in the `og:image` line of each page (search for `TODO` in the HTML files) so
Facebook/WhatsApp link previews show the logo.

## Admin guide (`/admin`)

Changes you make are held in the browser until you press **Publish changes** (the bar at the top). Nothing goes live earlier,
and **Discard** throws them away.

* **Overview** – counts, database status, links to the four price-source shops, backup & restore (download everything as one file).
* **Products** – add / edit / delete with prices and photos. Change a price, sale price or availability right in the table.
  Bulk actions (set availability, change prices by %, remove sale prices, delete). **Export prices (CSV)** → edit in Excel →
  **Import prices (CSV)** is the fastest way to update many prices. Each product has *Check market price* links to the other shops.
  The form changes with the category (an SSD shows Form Factor / Interface / Generation / Read & Write speed, an HDD shows 2.5-inch / 3.5-inch / RPM, and so on).
* **Pre-built PCs** – name, photo, price (automatic from the parts, or fixed), highlights, and a part picker that follows the same
  motherboard-first rule as the PC Builder, with live wattage and fit checks.
* **Offers & discounts** – a percent or ৳ discount for everything, a category, a brand or chosen products, with start / end dates.
  Prices on the site update by themselves; a "perk" is a banner with no price change (the free-service-charge one is a perk).
* **Store settings** – WhatsApp number (used by the floating button), phone, email, address, social links, home headline and the
  "service charge is free / pre-orders accepted / T&C apply" lines, in English and Bangla.
* **Website** – the original panels: Hero banner, Ticker, Services, Fonts, Colors & Glass, Background.

Availability: **In stock**, **Pre-order**, **Up coming**, **Out of stock**. Pre-order and In stock can be ordered; the starter
products are all *Pre-order* until you mark what you really hold.

## The PC Builder

* **Start with the motherboard.** CPU, CPU cooler, RAM and casing stay locked until one is chosen. After that each list shows
  **only parts that fit it**: the same CPU socket *and* the same platform (an Intel board never shows AMD processors), the same
  memory type (DDR4 / DDR5) with enough free slots, a cooler that supports the socket, a casing that takes the board size, and
  M.2 NVMe drives only if the board has an M.2 slot. If no part fits, the list says so and offers a WhatsApp message to ask you.
* Swapping the motherboard removes the parts that no longer fit and shows exactly which ones.
* **Estimated wattage** adds each part's real maximum power draw (+30 W for board, fans, USB). The **recommended PSU** adds 30% headroom.
* **CPU/GPU balance** compares a performance score for the CPU and the graphics card (Ryzen 5 5600 = 100, RTX 4060 = 100) for 1080p,
  1440p, 4K or editing. It is an estimate, and the page says so.
* Add to cart, **Save PC** (in this browser, plus a share link), **Print**, **Screenshot** (saves a clean quote image).

To make a product work in the builder, fill these in on its edit form:
Motherboard → Socket, Memory Type, Form Factor, RAM Slots · CPU → Socket (and *Power draw*, *Performance score*) ·
RAM → RAM Type, RAM Sticks · Casing → Motherboard Support · CPU Cooler → Socket · Power Supply → Watts.
The form will not save a product that is missing these. For CPUs and graphics cards also fill *Power draw* and *Performance score*.

## Prices

The starter prices were calibrated from Star Tech, Ryans, Techland and Computer Village listings checked on **10 October 2026**.
RAM, SSD and graphics-card prices are moving a lot right now, and some products had mixed prices across those shops, so **please
check every price once before publishing**. A website cannot read another shop's prices live, so prices are entered by you; the
CSV import and the "Check market price" links make that quick.

## Languages

Everything switches between English and Bangla. **Product names and technical specs are never translated** — DDR4, DDR5, AM5,
LGA1200, NVMe, M.2, WiFi 6, GDDR6, Windows 11, model names, sizes and speeds stay in English in both languages, and so do technical
spec labels (Socket, Chipset, RAM Type, Resolution …). Only plain words such as colours, "Included" and S/M/L sizes have a Bangla form
(`VALUE_BN` in `js/catalog-schema.js`). Page text lives in `js/translations.js` (original pages) and `js/i18n-shop.js` (shop pages).

## Changing categories and filters

Everything about categories — which sub-categories exist, which filters belong to each (e.g. SSD *Form Factor: 2.5" SATA / M.2 SATA / M.2 NVMe*,
HDD *Form Factor: 2.5-inch / 3.5-inch*) and the PC Builder rows — is in **`js/catalog-schema.js`**. After editing it run
`npm run pages` (creates the page files) and `npm run check`. Brand, Price and Availability filters are built in for every category.

## Files

```
home.html service.html terms.html admin.html …   page files (shop pages are tiny shells made by scripts/build-pages.mjs)
shop/…                                           /shop, /shop/<category>, /shop/<category>/<sub-category>
css/       variables, base, components (original) · shop.css (shop, builder, cart, landing) · admin-shop.css
js/        catalog-schema.js · shop-seed.js · shop-core.js · shop-ui.js · builder-logic.js · blocks.js · layout.js · boot.js
js/pages/  one file per shop page (home, shop, components, offers, builds, product, cart, builder)
js/admin/  admin panels (products, builds-offers, store, core)
api/       Vercel functions (12)      functions/api/   same endpoints for Cloudflare Pages
lib/       storage, sessions, validation (the server re-checks everything the admin saves)
scripts/   dev-server.mjs · build-pages.mjs · check-site.mjs
```

## Fixed while rebuilding

* The default hero image pointed at `/css/images/…` and 404'd (relative path inside a CSS variable).
* Every page showed the homepage title in the browser tab; pages now keep their own title.
* The mobile menu closed at a different width (860px) than it opens (940px).
* The theme listener was registered again on every language switch, piling up work.
* A malformed cookie could crash an API request.
* A forced 1.4-second loading splash on every page is gone.
* The admin login had no limit on wrong passwords: now 8 tries per 15 minutes per visitor.
* Service images used unescaped text in HTML attributes.
* `.env.example` was mentioned but missing: added.
* The "Coming Soon" PC configurator section is replaced by the working PC Builder.

## Good to know

* Pages are drawn by JavaScript, like the original site, so search engines see the page shell first. The home, shop and product pages
  have proper titles and descriptions.
* Product photos you upload are shrunk to 900px WebP and stored in Upstash (about 60–150 KB each). For hundreds of photos consider
  hosting them elsewhere and pasting the link into the product form.
* Saved PCs and the cart live in the visitor's own browser.
* Terms in `/terms` for shop orders, pre-orders and the free service charge are deliberately general — adjust the wording in
  `js/data.js` (`shopTerms`) if your policy on advance payment, delivery time or warranty is more specific.
