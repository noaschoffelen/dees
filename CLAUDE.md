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
locally even though they resolve fine once deployed. `robots.txt` and `sitemap.xml`
live at the repo root alongside the pages.

## Structure

```
index.html          Home — "Ken je Dees?"
menu.html            Menu (Coming Soon)
ateliers.html        Ateliers + contact form
crew.html            Dees Crew + sollicitatie (application) form
vergaderen.html      Vergaderen (coming soon)
robots.txt            Allow-all + sitemap pointer
sitemap.xml            The 5 pages, extensionless URLs
vercel.json            cleanUrls + trailingSlash config
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
(nav, footer, mobile menu), update it identically across all five pages.

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
4. Contact forms (`form[action*="formspree.io"]`) — used by `ateliers.html` and
   `crew.html`. Submits via `fetch()` with `FormData`, shows inline status in
   `.form__status`, disables the submit button while in flight. `ateliers.html` posts to
   Formspree form `maewrvnq` (→ ateliers@deestilburg.nl); `crew.html` posts to
   `mkjwdyny` (→ info@deestilburg.nl). Formspree file uploads need a paid plan, so the
   crew form doesn't attempt them — cv/motivatie instead go through a separate
   `mailto:personeel@deestilburg.nl?subject=Sollicitatie` button next to the form, which
   opens the applicant's own mail client for them to attach files directly.

## SEO / social metadata

Every page carries its own `<title>`, `meta description`, and matching
`og:*`/`twitter:*` tags (title, description, `og:url`, and a shared
`assets/img/graphic/og-image.png` social-share card). The homepage additionally has
JSON-LD (`Bakery`/`CafeOrCoffeeShop`) structured data with name, address, and `sameAs`
links (Instagram, Google Business Profile) — deliberately no `telephone`/`openingHours`
yet since those are still placeholders; add them once real values exist. Search Console
is verified via the `google-site-verification` meta tag on `index.html` only — don't
remove it.

## Known placeholders / intentional TODOs

- **Serial A** (the brandbook's slanted/condensed display font, used in the original
  poster-style marquee treatment) is not in use — only unlicensed trial files exist in
  `brand/fonts/A/`. Don't wire it into `css/fonts.css`/`--font-display` until a real
  license is confirmed with the user.
- Opening hours are still a placeholder in the footer.

## Git workflow

- Commit automatisch na elke voltooide en werkende wijziging, zonder te vragen.
  Gebruik een duidelijk, kort commit-bericht dat samenvat wat er is veranderd
  (bijv. "Add contact form to homepage", niet "update").
- Push NIET automatisch naar GitHub. Wacht altijd op expliciete toestemming
  van de gebruiker voordat je `git push` uitvoert.
- Als er iets kapot is of een fout oplevert, commit dan niet — meld dit eerst
  aan de gebruiker.
