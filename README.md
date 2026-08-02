# Ovi's Fix — Website

A bilingual (English / Bangla), light & dark mode website for Ovi's Fix
computer repair services in Keraniganj, Dhaka. Plain HTML/CSS/JS — **no
build step, no framework, no npm install required to run it** — plus a
small serverless backend for the contact form.

---

## 1. What's in here

```
ovis-fix-website/
├── index.html          Main landing page (hero, services, comparison, why-us, FAQ, contact)
├── terms.html           Terms & Conditions page
├── css/
│   ├── variables.css    Color/typography/spacing tokens for light + dark mode
│   ├── base.css         Reset + base typography
│   ├── components.css   Navbar, glass/acrylic cards, service tickets, forms, footer…
│   ├── animations.css    Loading screen + scroll-reveal keyframes
│   └── responsive.css    Mobile/tablet breakpoints
├── js/
│   ├── data.js           ALL bilingual content: services, prices, comparison, FAQ, terms
│   ├── translations.js    UI chrome strings (nav, buttons, labels) — en + bn
│   ├── render.js          Builds the dynamic sections from data.js
│   ├── theme.js           Dark/light toggle
│   ├── language.js        EN/BN toggle
│   ├── navbar.js           Mobile menu behaviour
│   ├── animations.js       Scroll reveal, mouse parallax, loading screen
│   ├── contact-form.js     Form validation + submit
│   ├── icons.js            Self-contained SVG icon set
│   └── main.js             Wires everything together
├── images/                Your service photos + logo + generated favicons
├── api/contact.js          Contact form backend — Vercel serverless function
├── functions/api/contact.js Contact form backend — Cloudflare Pages function
├── package.json            Metadata only (no required dependencies)
└── .env.example             Environment variables you'll need
```

You only need **one** of `api/contact.js` or `functions/api/contact.js`
depending where you deploy — it's fine to leave both in the repo, each
platform only looks at its own folder.

---

## 2. Preview it locally

No build step — just serve the folder and open it:

```bash
npx serve . -l 3000
```

Then visit `http://localhost:3000`. (The contact form's "Send Message"
button will show a friendly "not configured yet" message until you add a
Resend API key — see below. Everything else works immediately.)

---

## 3. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import that repo.
3. Framework preset: choose **"Other"**. Leave build command empty and output
   directory as `.` — Vercel will serve the static files and automatically
   pick up `api/contact.js` as a serverless function. No config file needed.
4. Add the environment variables from `.env.example` under **Settings →
   Environment Variables**.
5. Deploy.

## 4. Deploy to Cloudflare Pages

1. Push this folder to a GitHub repo.
2. On the Cloudflare dashboard → **Workers & Pages → Create → Pages →
   Connect to Git**.
3. Framework preset: **None**. Build command: empty. Build output
   directory: `/` (project root).
4. Cloudflare will automatically detect `functions/api/contact.js` and
   serve it at `/api/contact`.
5. Add the same environment variables under **Settings → Environment
   Variables**.
6. Deploy.

---

## 5. Making the contact form actually send email

The form posts to `/api/contact`, which uses **[Resend](https://resend.com)**
(a transactional email API with a generous free tier) via plain `fetch` —
no SDK, so it runs on both Vercel and Cloudflare unchanged.

1. Create a free Resend account → **API Keys** → create one.
2. Set `RESEND_API_KEY` in your host's environment variables (see above).
3. By default, mail is sent from Resend's shared test address
   (`onboarding@resend.dev`), which can only deliver to *your own* Resend
   account email while you're unverified. To send to
   `contact.ovisfix@gmail.com` reliably, either:
   - Verify a domain you own in Resend and set `FROM_EMAIL` to an address
     on that domain, **or**
   - Keep the test sender for now — replies go to whoever filled the form
     in either case, since `reply_to` is always set to their email.
4. `TO_EMAIL` defaults to `contact.ovisfix@gmail.com` — override if needed.

Until `RESEND_API_KEY` is set, the form shows a graceful error asking
people to use WhatsApp or email instead — it won't silently fail.

---

## 6. Things you'll want to personalize

- **Social links** — Facebook, Instagram, YouTube, and LinkedIn are placeholders
  (`href="#"`) in `index.html` — search for `TODO: replace` (three spots:
  the contact panel, and the footer) and drop in your real profile URLs.
  WhatsApp is already live, linked to `+880 1948-977199`.
- **Market comparison numbers** — the "Typical Market Rate" figures in
  `js/data.js` (`comparison` array) are *rounded estimates* built to
  illustrate the 30–50% savings claim, not verified competitor quotes.
  Swap in real numbers whenever you've researched local competitors —
  the footnote under the table already flags them as estimates.
- **Prices & services** — everything lives in `js/data.js`. Add, remove,
  or reprice a service by editing that one array; the grid and comparison
  table rebuild automatically.
- **Bangla copy** — I translated everything myself; you know the local
  tone better than I do, so it's worth a proofread pass in
  `js/translations.js` and `js/data.js` before launch.
- **Open Graph image** — `index.html` points `og:image` at `images/logo.jpg`
  as a relative path; once you have a real domain, change it to the full
  `https://yourdomain.com/images/logo.jpg` so link previews on Facebook/
  WhatsApp pick it up correctly.

### A wording change worth knowing about

The original price list described two services as installing
"non-genuine" copies of Microsoft Office and Adobe apps. I kept both
services and their prices, but rewrote the public copy as **"Microsoft
Office Setup & Activation"** and **"Adobe Creative Cloud Setup"**, framed
around installation/activation support rather than advertising unlicensed
software — publicly marketing pirated-software installs is legal exposure
for the business (and not something I'll write ad copy for). What you
actually offer in person is your call; I just didn't want the *website
itself* to be the thing publicly advertising it. Easy to find and adjust
in `js/data.js` if you want different wording.

---

## 7. Design notes

- **Glass vs. acrylic**: desktop cards use a lighter, more translucent
  `.glass` style. The mobile popover menu deliberately uses a separate,
  near-opaque `.acrylic` style instead — that's the fix for glass panels
  overlapping and getting unreadable against whatever's scrolled behind
  them on small screens.
- **Pricing "tickets"**: every price is set in monospace inside a
  dashed-border ticket, meant to read like a line on a service receipt —
  a nod to the free "System Diagnostic Report" being the site's whole
  entry point.
- Dark mode uses solid white for service card and FAQ body text
  specifically (as requested); headlines use an off-white with a red→blue
  gradient accent word instead, so big text doesn't compete with the
  body copy.
- Reduced-motion is respected — anyone with "reduce motion" set at the OS
  level gets the content instantly, no parallax or scroll animation.

Built for Ovi's Fix — Keraniganj, Dhaka.
