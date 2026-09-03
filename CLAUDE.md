# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing website for **Dees** — a bakery/ateliers/coffee spot in Tilburg (brood •
ateliers • koffie). Plain HTML/CSS/JS, no build tooling, no framework, no package.json.
Content and copy are in Dutch.

## Running locally

No build step. Serve the site with any static file server, e.g.:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080. (`npx serve .` also works.)

There is no test suite, linter, or build/deploy command in this repo.

### Lokaal bekijken

Na elke voltooide wijziging: zorg dat de lokale development server draait
(start deze als hij nog niet actief is) en geef de gebruiker de lokale URL
(bijv. http://localhost:8000) om de wijziging direct te bekijken.

`python3 -m http.server` stuurt geen cache-control headers mee, waardoor
browsers CSS/JS agressief cachen en de gebruiker soms een verouderde versie
ziet. Voeg daarom altijd een cache-bustende query-parameter toe aan de URL
die je deelt, bijv. `http://localhost:8000/?v=<timestamp>` (of op de
specifieke pagina, bijv. `index.html?v=<timestamp>`), zodat de gebruiker
zonder hard-refresh altijd de laatste versie ziet.

## Hosting

Deployed on **Vercel**, connected to this GitHub repo (`noaschoffelen/dees`), root as
source directory, no build command. Custom domain `deestilburg.nl` points at Vercel via
DNS (A records to Vercel's edge IPs, managed through Cloudflare DNS). There used to be a
duplicate `site/` copy of the whole tree (a leftover from early GitHub Pages hosting) —
it was removed once Vercel/root became the single source of truth, and GitHub Pages
itself was disabled on the repo. There should only ever be one copy of the site files
and one active host now; if a `site/` directory or GitHub Pages reappears, flag it
rather than silently maintaining two copies.

`vercel.json` sets `"cleanUrls": true`, so every page is linked/referenced without its
`.html` extension (`menu.html` → `/menu`) — internal links, `sitemap.xml`, and `og:url`
tags all use the extensionless form; Vercel handles the redirect from the old `.html`
URL automatically. This only works on Vercel — the plain local dev server (`python3 -m
http.server`) does **not** understand `cleanUrls`, so internal nav links will 404
locally even though they resolve fine once deployed (use `vercel dev` instead if you
need cleanUrls or the `/api/*` functions to work locally — see "Email & forms backend"
below). `robots.txt` and `sitemap.xml` live at the repo root alongside the pages.

DNS is on **Cloudflare** (nameservers `raina`/`ray.ns.cloudflare.com`), self-managed by
the client (own account, scoped "Edit zone DNS" API token — never the Global API Key).
The root and `www` records point directly at Vercel and are **not** proxied (grey cloud,
"DNS only") — Vercel's SSL and the mail records below both expect that; don't turn
proxying on without re-checking both still work. Google Workspace handles the actual
`@deestilburg.nl` mailboxes (MX `smtp.google.com`, DKIM `google._domainkey`, SPF
`v=spf1 include:_spf.google.com ~all`, DMARC `p=none`) — Resend's own MX/SPF/DKIM live
scoped to the `send.` subdomain specifically so they never collide with Google's root
records (see below).

## Structure

```
index.html          Home — "Ken je Dees?"
menu.html            Menu (Coming Soon)
ateliers.html        Ateliers + contact form
crew.html            Dees Crew + sollicitatie (application) form
vergaderen.html      Vergaderen (coming soon)
privacy.html          Privacybeleid — linked from every footer and both forms
contact.html          Contact — address, phone, email, socials, embedded Google Map
robots.txt            Allow-all + sitemap pointer
sitemap.xml            The 7 pages, extensionless URLs
vercel.json            cleanUrls + trailingSlash + security headers (CSP etc.) config
api/
  ateliers-contact.js  Serverless function behind the ateliers contact form (see below)
  crew-apply.js        Serverless function behind the sollicitatie form (see below)
  _utils.js            Shared helpers (header sanitizing, email validation, rate limit) —
                       the `_` prefix keeps it from becoming its own route
css/
  styles.css         Design system: color/type/spacing tokens in :root, then components
  fonts.css           Local @font-face rules (Serial B Neue: regular + heavy)
js/main.js            Vanilla JS, no dependencies (see below)
assets/
  fonts/              Locally hosted Serial B Neue webfonts (.woff2/.woff) — just the
                       Regular/Heavy files actually used; the full 10-weight source
                       family lives in brand/fonts/, not here
  img/                logo/ (SVG), hands/, photo/, graphic/ (incl. the og:image social
                       card) — only assets actually referenced by a page belong here;
                       unused exports/photo options go in brand/ instead
```

`brand/` (root only) holds source material: the brandbook PDF, official logo exports
(`brand/logo/<color>/{SVG,EPS,AI,1x}`), font drops (`brand/fonts/`), the original hand
icon upload (`brand/hands/`), and moodboard/hero/reserve photos (`brand/images/`,
`brand/moodboard/`). It is not served — treat it as where raw deliverables from the
designer (DETLET) or the client land, including photo options that didn't end up on the
site, before being processed into `assets/`.

Every HTML page follows the same shape: `<header class="nav">` with the same nav links,
a `#mobile-menu` panel, page content, and a shared footer — copy-paste consistent across
pages rather than templated (there's no templating system). When changing shared chrome
(nav, footer, mobile menu), update it identically across all seven pages (the five main
pages plus `privacy.html` and `contact.html`).

## Design system (`css/styles.css`)

CSS custom properties in `:root` are the single source of truth for brand values:

- Colors: `--blue #94C5ED`, `--red #F11F0A`, `--purple #5F1B47`, `--ink`, `--paper`
  (plus derived `--blue-deep`, `--paper-warm`, `--ink-soft`)
- Type: `--font-display` and `--font-body` both resolve to **Serial B Neue** (loaded at
  weight 400 "regular" and weight 800 "heavy" in `css/fonts.css`) — headings/kickers/
  buttons use `font-weight: 800` (heavy), body text defaults to 400 (regular). Fluid
  `clamp()`-based `--fs-*` sizes.
- Layout rhythm: `--maxw`, `--gutter`, `--section-y`, `--radius` / `--radius-lg`

Change brand colors/type/spacing here rather than hardcoding values in individual pages.

The **marquee** (`.marquee`/`.marquee__track`, used on every page) is a seamless
infinite-scroll built from two identical `<span>` copies of the same phrase; the track
uses `width: max-content` and `flex-shrink: 0` on the spans specifically to avoid the
content getting visually squeezed/overlapping at narrow viewports — don't remove those
without re-testing the loop at multiple widths. The whole track (not the individual
spans) carries the `skewX(-7deg)` transform, combined with the scroll `translateX` in
the same `@keyframes` rule, so the seam between the two repeated copies stays visually
consistent.

The pointing-hand icon (`assets/img/hands/h-right.svg`, used via `.hand-inline` and
inside marquees) has a small `wiggle` keyframe animation (a forward/back "poke", not a
rotation) applied via `.hand-inline`; marquee hand icons intentionally do **not**
animate. Respect `prefers-reduced-motion` when touching any animated element (see the
`@media (prefers-reduced-motion: reduce)` block).

## `js/main.js` behavior

Single IIFE, no dependencies, covers these independent concerns — keep additions scoped
the same way rather than introducing a framework or build step:

1. Footer year (`#jaar`)
2. Mobile nav toggle (`.nav__toggle` / `#mobile-menu`, syncs `aria-expanded`)
3. Scroll-reveal via `IntersectionObserver` for any `.reveal` element (falls back to
   immediately showing content if unsupported)
4. Contact forms (`form[action^="/api/"]`) — used by `ateliers.html` and `crew.html`.
   Intercepts submit, converts any `<input type="file">` fields to `{filename, content}`
   (base64) via `FileReader`, then POSTs everything as one JSON body to the form's own
   `/api/*` endpoint. Client-side blocks file uploads over ~3MB combined (see "Email &
   forms backend" for why) and shows inline status in `.form__status`, disabling the
   submit button while in flight.

## Email & forms backend (`/api/*`)

Both forms post JSON to their own Vercel serverless function (plain Node.js,
`module.exports = async function handler(req, res) {...}`, no framework) which sends the
actual email via the **Resend** API (`api.resend.com/emails`, `RESEND_API_KEY` env var —
set in Vercel's Production **and** Preview environment variables, not just `.env.local`;
a local-only key does nothing once deployed). Resend's domain verification lives on the
`send.` subdomain (see DNS note above), and the sending "From" address stays Dees's own
verified address — only the **display name** is set to the submitter's name, since the
literal From address can't be spoofed to the visitor's own email (SPF/DKIM/DMARC block
that, by design). `reply_to` is set to the visitor's address so replying in Gmail goes
straight to them.

- `api/ateliers-contact.js` → `ateliers@deestilburg.nl`, subject `Interesse atelier — {naam}`.
- `api/crew-apply.js` → `info@deestilburg.nl`, subject `Sollicitatie website — {naam}`.
  Accepts `cv`/`motivatie` as `{filename, content}` and attaches them directly to the
  email via Resend's `attachments` field (base64) — no third-party file host needed.
  Server-side re-validates file extension (`.pdf`/`.doc`/`.docx`) and combined size
  (~4MB base64 ≈ Vercel's hard 4.5MB request-body limit) since the client-side check is
  trivially bypassable by posting to the endpoint directly.

Both endpoints share `api/_utils.js`: `sanitizeHeaderValue` (strips `\r\n`/`"<>"` from
the name before it's interpolated into the From/Subject headers — prevents header
injection), `isValidEmail` (basic format check), and `isRateLimited` (in-memory,
per-IP, 5 requests / 10 min). That rate limiter is **best-effort only** — its `Map`
lives in module scope, so it only persists for as long as a given serverless instance
stays warm, and resets on a cold start. It's a deliberate, zero-cost/zero-dependency
mitigation against basic scripted spam, not a hard guarantee; don't rely on it for
anything security-critical. Both forms also carry a honeypot field (`name="website"`,
visually hidden, `tabindex="-1"`) — a filled-in honeypot makes the handler return `200
{ok:true}` without actually sending anything.

**Testing locally:** `python3 -m http.server` can't run these functions or `cleanUrls`
— use `vercel dev` instead, and pass the key inline
(`RESEND_API_KEY="re_..." vercel dev`) since `vercel dev` has not reliably picked up
`.env.local` in this project (root cause not fully confirmed — possibly the space in
the `/Users/noa/ Dees/Website` folder name).

## SEO / social metadata

Every page carries its own `<title>`, `meta description`, and matching
`og:*`/`twitter:*` tags (title, description, `og:url`, and a shared
`assets/img/graphic/og-image.png` social-share card). The homepage additionally has
JSON-LD (`Bakery`/`CafeOrCoffeeShop`) structured data with name, address, and `sameAs`
links (Instagram, Google Business Profile, LinkedIn) — deliberately no `telephone`/`openingHours`
yet since those are still placeholders; add them once real values exist. Search Console
is verified via the `google-site-verification` meta tag on `index.html` only — don't
remove it.

## Known placeholders / intentional TODOs

- **Serial A** (the brandbook's slanted/condensed display font, used in the original
  poster-style marquee treatment) is not in use — only unlicensed trial files exist in
  `brand/fonts/A/`. Don't wire it into `css/fonts.css`/`--font-display` until a real
  license is confirmed with the user.
- Opening hours are still a placeholder in the footer.
- `privacy.html` is a good-faith first draft based on what the site actually does
  (which forms collect what, which processors — Resend/Google Workspace/Vercel — are
  involved) but has not been legally reviewed; don't treat its wording as final.
- The site currently runs on Vercel's free **Hobby** plan, whose ToS restricts it to
  non-commercial use — technically out of compliance for a revenue-generating business
  site. Flagged to the client; upgrading to Pro is their call, not something to do
  unprompted.
- The sollicitatie form on `crew.html` is temporarily closed (team is fully staffed): the
  form stays visible but faded and `inert` behind an overlay pointing to Instagram, and
  `api/crew-apply.js` has `SOLLICITATIES_OPEN = false` as a server-side backstop. Flip
  that constant back to `true` (and remove the `inert`/overlay markup) once hiring
  reopens — don't do it unprompted.
- `contact.html` embeds a Google Maps iframe (no API key, the `output=embed` URL format),
  which needed `frame-src https://www.google.com` added to the CSP in `vercel.json` —
  the only relaxation of an otherwise locked-down policy.

## Git workflow

- Commit automatisch na elke voltooide en werkende wijziging, zonder te vragen.
  Gebruik een duidelijk, kort commit-bericht dat samenvat wat er is veranderd
  (bijv. "Add contact form to homepage", niet "update").
- Push NIET automatisch naar GitHub. Wacht altijd op expliciete toestemming
  van de gebruiker voordat je `git push` uitvoert.
- Als er iets kapot is of een fout oplevert, commit dan niet — meld dit eerst
  aan de gebruiker.
