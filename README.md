# Ovi's Fix — Website

A bilingual (English / Bangla), light & dark mode website for Ovi's Fix
computer repair services in Keraniganj, Dhaka. Plain HTML/CSS/JS — **no
build step, no framework** — plus serverless functions for the contact
form and a password-protected admin panel for managing services live.

---

## 1. What's in here

```
ovis-fix-website/
├── index.html              Main landing page
├── terms.html                Terms & Conditions page
├── admin.html                 Admin panel (password-protected)
├── css/                        variables, base, components, animations, responsive, admin
├── js/
│   ├── data.js                  Bilingual content: default services, comparison, FAQ, terms, configurator
│   ├── translations.js           UI chrome strings (nav, buttons, labels) — en + bn
│   ├── render.js                  Builds the dynamic sections; fetches live services with fallback
│   ├── admin.js                    Admin panel logic (login, edit, save)
│   ├── theme.js / language.js       Dark/light + EN/BN toggles
│   ├── navbar.js / animations.js     Mobile menu, scroll reveal, parallax, loading screen
│   ├── contact-form.js               Contact form validation + submit
│   └── icons.js                       Self-contained SVG icon set
├── images/                    Photos, logo, generated favicons
├── lib/                         Shared backend logic (see §7) — used by BOTH platforms below
├── api/                          Vercel serverless functions
│   ├── contact.js, services.js, ticker.js
│   └── admin/  login.js, logout.js, check.js, services.js, ticker.js
├── functions/api/                 Cloudflare Pages Functions — same endpoints, same lib/
├── vercel.json                     Clean URLs (so /terms works, not just /terms.html)
└── .env.example                     Every environment variable you'll need, explained
```

You only need **one** of `api/` or `functions/api/` depending where you
deploy — both read from the same `lib/` folder, so keeping both around
costs nothing and means you can switch hosts later without rewriting
anything.

---

## 2. Preview it locally

```bash
npx serve . -l 3000
```

Visit `http://localhost:3000`. The contact form and admin panel will show
friendly "not configured yet" messages until you set up the environment
variables below — everything else works immediately.

---

## 3. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import that repo.
3. Framework preset: **Other**. Leave build command empty, output directory `.`
   Vercel auto-detects `api/*.js` as serverless functions — no config needed
   beyond the included `vercel.json` (which just enables clean URLs).
4. Add the environment variables from `.env.example` under **Settings →
   Environment Variables**.
5. Deploy.

## 4. Deploy to Cloudflare Pages

1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Framework preset: **None**. Build command empty. Output directory `/`.
4. Cloudflare auto-detects `functions/api/**`.
5. Add the same environment variables under **Settings → Environment Variables**.
6. Deploy.

---

## 5. Multi-page sites, explained

You already have this working — `terms.html` and `admin.html` are proof.
With a plain static site (no framework), **every `.html` file you put in
the project root automatically becomes its own page**, with zero config:

- `index.html` → `yourdomain.com/`
- `terms.html` → `yourdomain.com/terms` (clean URL, thanks to `vercel.json`)
- `admin.html` → `yourdomain.com/admin`

When you're ready to build the real interactive PC configurator (the
"coming soon" section on the homepage), you'd do exactly what `terms.html`
already demonstrates: create `configurator.html`, copy the `<head>`,
navbar, and footer markup from `index.html` (so it matches the site), add
its own content in `<main>`, and link `js/main.js` the same way. It
inherits every shared style and script — theme, language, animations, all
of it — for free, because they're the same files. No routing library, no
build step, nothing to configure. That's the whole trick.

If a page needs its **own** backend logic (like `admin.html` does), the
pattern is the same one used throughout this project: add a `.js` file
under `api/` (Vercel) and a matching one under `functions/api/` (Cloudflare),
both importing whatever they need from `lib/`.

---

## 6. Contact form email (Resend)

The form posts to `/api/contact`, using [Resend](https://resend.com) via
plain `fetch` (no SDK, works on both hosts unchanged).

1. Free Resend account → **API Keys** → create one → set `RESEND_API_KEY`.
2. Mail sends from Resend's shared test address by default, which can only
   deliver to *your own* Resend account email until you verify a domain.
   Verify a domain and set `FROM_EMAIL` when you're ready to go live, or
   leave it as-is for now — replies always go to whoever filled the form in
   either case, since `reply_to` is set automatically.
3. `TO_EMAIL` defaults to `contact.ovisfix@gmail.com`.

Until `RESEND_API_KEY` is set, the form shows a graceful error pointing
people to WhatsApp/email instead of silently failing.

---

## 7. Admin panel — manage services & the hero ticker without touching code

Visit `/admin.html`, log in, and you can:
- Add, edit, reorder, or delete the **hero ticker lines** — the scrolling
  strip of text under the homepage's featured image.
- Add, edit, or delete any **service** — price, bilingual title/description,
  image filename.

Hit **Save** on either section and the homepage picks up the change on its
next visit. The two are independent — saving one doesn't touch the other.

### How it works under the hood

- Both the services list and the ticker lines are stored as JSON blobs in
  **Upstash Redis** (a serverless Redis host with a generous free tier),
  read through a small REST API using plain `fetch` — same "no SDK"
  approach as the contact form, so it works identically on Vercel and
  Cloudflare.
- The homepage always tries `/api/services` and `/api/ticker` first; if
  Upstash isn't set up yet, or a request fails for any reason, it silently
  falls back to the bundled defaults in `js/data.js`. **The public site can
  never break because of the admin panel** — worst case, it just shows the
  defaults.
- Logging in sets a signed, HTTP-only cookie (24-hour expiry). There's no
  session database — the signature itself proves it's legitimate, checked
  fresh on every request. This is deliberately simple: appropriate
  password protection for one shop owner managing his own site, not a
  multi-user enterprise auth system.

### One-time setup

1. **Create the database.** Sign up at [upstash.com](https://upstash.com)
   (free tier is plenty for this) → Create Database → Redis. Once created,
   open its **REST API** tab and copy the `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` values.
2. **Set your admin password.** Pick something long and unique — set it as
   `ADMIN_PASSWORD`.
3. **Set a signing secret.** Any long random string works — e.g. run
   `openssl rand -hex 32` in a terminal, or just mash the keyboard for 40+
   characters. Set it as `AUTH_SECRET`. You never need to remember it,
   only paste it into your host's environment variables once.
4. Add all four variables (`UPSTASH_REDIS_REST_URL`,
   `UPSTASH_REDIS_REST_TOKEN`, `ADMIN_PASSWORD`, `AUTH_SECRET`) in your
   host's dashboard (same place as `RESEND_API_KEY`), then redeploy.
5. Visit `/admin.html`, log in, and your existing 18 services will load
   automatically the first time (fetched from the bundled defaults) —
   click **Save All Changes** once to write them into Upstash, and from
   then on you're editing the live data.

**A heads-up:** I designed the Upstash integration carefully against
their documented REST API, but couldn't test it against a real database
from where I built this. If something doesn't connect on the first try,
check Upstash's current REST API docs against `lib/upstash.js` — the
shape is a simple `GET {url}/get/{key}` / `POST {url}/set/{key}` with a
`Bearer` token, and if that's changed, it's a small, contained fix in that
one file. Let me know and I can help sort it out.

### A couple of things worth knowing

- **Deleting a service** that's referenced in the homepage's "Why Pay
  More?" comparison table just makes that row quietly disappear next time
  the page loads — it won't error out.
- **Changing a service's ID** after it's been saved isn't recommended,
  since the comparison table matches services by ID. The ID field is
  read-only for existing services in the admin UI for exactly this reason
  — it's only editable while a service is brand new and unsaved.
- Only the **services list** is admin-editable. FAQ, the comparison
  table's "market rate" figures, Why Us, and Terms still live in
  `js/data.js` — edit that file directly for those (same as before).

---

## 8. Things you'll want to personalize

- **Social links** — Facebook, Instagram, and YouTube are live; LinkedIn is
  still a placeholder (`href="#"`) in `index.html` and the footer — swap it
  in whenever you have a profile URL.
- **Market comparison numbers** — the "Typical Market Rate" figures in
  `js/data.js` (`comparison` array) are rounded estimates illustrating the
  30–50% savings claim, not verified competitor quotes. Swap in real
  numbers whenever you've researched local competitors.
- **Bangla copy** — I translated everything myself; worth a proofread pass
  in `js/translations.js` and `js/data.js` before launch.
- **Curly tagline font** — replaced with Montserrat Bold across the whole
  site per your latest direction; the old Lobster/Space Grotesk/Poppins
  mix is gone.
- **Configurator image crop** — the Pre-configured Mode card's photo has
  its crop position tuned in `css/components.css` under
  `.mode-card-image[data-mode="preconfigured"] img` (look for the comment
  explaining the 0–100% scale). Nudge that one number if you want more or
  less headroom above the text baked into that photo.
- **Open Graph image** — `index.html` points `og:image` at `images/logo.jpg`
  as a relative path; once you have a real domain, change it to the full
  `https://yourdomain.com/images/logo.jpg` so link previews on Facebook/
  WhatsApp pick it up correctly.

### A wording change worth knowing about

The original price list described two services as installing
"non-genuine" copies of Microsoft Office and Adobe apps. I kept both
services and their prices, but rewrote the public copy as **"Microsoft
Office Setup & Activation"** and **"Adobe Creative Cloud Setup"** —
installation/activation framing rather than advertising unlicensed
software, since that's legal exposure for the business and not something
I'll write ad copy for either way. What you offer in person is your call;
I just didn't want the website itself to be what's publicly marketing it.

---

## 9. Design notes

- **Dark mode background**: near-black (`#050608`) rather than navy-gray,
  with three very low-opacity radial gradients (blue and a whisper of red)
  layered on top via `body`'s background in `css/base.css` — echoes the
  "deep black with glowing RGB lighting" look of the product photography
  instead of a flat navy fill. Subtle enough that text contrast is
  unaffected.
- **Typography**: Montserrat across all English text — headings, body,
  the brand name, and the hero stat numbers all share it now, at
  different weights for hierarchy (800 for the hero headline and stat
  numbers, 600–700 for section headings, 400–500 for body copy). Bangla
  stays on Kalpurush throughout, untouched. Prices and "eyebrow" labels
  keep IBM Plex Mono — a deliberate, separate treatment (see the ticket
  note below), not part of the general text system.
- **Hero ticker**: the scrolling line under the featured image is
  admin-editable (§7) and loops seamlessly — the line list renders twice
  back-to-back and the CSS animation just slides by exactly one copy's
  width, so it never visibly "jumps."
- **Glass vs. acrylic**: desktop cards use a lighter, translucent `.glass`
  style. The mobile popover menu uses a separate, near-opaque `.acrylic`
  style instead — the fix for glass panels overlapping and getting
  unreadable against whatever's scrolled behind them on small screens.
- **Pricing "tickets"**: every price renders in monospace inside a
  dashed-border ticket — a nod to the free "System Diagnostic Report"
  being the site's entry point, and a signal that pricing here is exact
  and itemized, not a vague quote.
- Dark mode uses solid white specifically for service card and FAQ body
  text (as requested); headlines use an off-white with a red→blue
  gradient accent word instead, so big text doesn't compete with body copy.
- Bangla headings get extra line-height (1.5 vs. 1.15) — Bengali
  conjuncts and vowel signs extend further above/below the baseline than
  Latin letters, and the tighter Latin value was clipping them against
  ancestors with `overflow: hidden`. Tracked-out uppercase styling (used
  on English "eyebrow" labels) is switched off for Bangla too, since the
  script has no letter-casing and the extra spacing was breaking up
  conjuncts.
- Reduced-motion is respected throughout — including the stat count-up
  animation — for anyone with "reduce motion" set at the OS level.

Built for Ovi's Fix — Keraniganj, Dhaka.
