# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing website for **Dees** — a bakery/ateliers/coffee spot in Tilburg (brood •
ateliers • koffie). Plain HTML/CSS/JS, no build tooling, no framework, no package.json.
Content and copy are in Dutch.

## Running locally

No build step. Serve the site with any static file server, e.g.:

```bash
cd site
python3 -m http.server 8080
```

Then open http://localhost:8080. (`npx serve site` also works.)

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

## ⚠️ Duplicated site tree — read before editing any page/asset

The exact same set of files exists in **two places**:

- `./index.html`, `./menu.html`, `./ateliers.html`, `./crew.html`, `./vergaderen.html`,
  `./css/`, `./js/`, `./assets/` (repo root)
- `./site/` — a byte-for-byte duplicate of the above

The README documents `site/` as the folder to serve, but the root-level copy was the
original location (added in the "Website bestanden toegevoegd" commit; the `site/` copy
was added afterward in the "Add .gitignore" commit). Nothing in the repo currently
generates one from the other.

**When making content, style, or script changes, check whether the same edit needs to be
applied to both the root copy and `site/` copy**, and confirm with the user which one is
canonical/deployed if it isn't obvious from context. Don't silently let the two trees
drift out of sync.

## Structure (per copy, root and `site/` alike)

```
index.html          Home — "Ken je Dees?"
menu.html            Menu
ateliers.html        Ateliers + contact form
crew.html            Dees Crew
vergaderen.html      Vergaderen (coming soon)
css/
  styles.css         Design system: color/type/spacing tokens in :root, then components
  fonts.css           Local @font-face rules (current stand-in fonts: Baloo 2 + Nunito)
js/main.js            Vanilla JS, no dependencies (see below)
assets/
  fonts/              Locally hosted .woff2 webfonts
  img/                logo/, hands/, photo/, graphic/ — extracted from the brandbook
```

`brand/` (root only) holds source material: the brandbook PDF and drop folders
(`brand/brandbook`, `brand/logo`, `brand/fonts`, `brand/images`, `brand/moodboard`) used
to populate `assets/`. It is not served.

Every HTML page follows the same shape: `<header class="nav">` with the same nav links,
a `#mobile-menu` panel, page content, and a shared footer — copy-paste consistent across
pages rather than templated (there's no templating system).

## Design system (`css/styles.css`)

CSS custom properties in `:root` are the single source of truth for brand values:

- Colors: `--blue #94C5ED`, `--red #F11F0A`, `--purple #5F1B47`, `--ink`, `--paper`
  (plus derived `--blue-deep`, `--paper-warm`, `--ink-soft`)
- Type: `--font-display` (Baloo 2, standing in for the brandbook's "Serial A"),
  `--font-body` (Nunito, standing in for "Serial B"), fluid `clamp()`-based `--fs-*` sizes
- Layout rhythm: `--maxw`, `--gutter`, `--section-y`, `--radius` / `--radius-lg`

Change brand colors/type/spacing here rather than hardcoding values in individual pages.

## `js/main.js` behavior

Single IIFE, no dependencies, covers four independent concerns — keep additions scoped
the same way rather than introducing a framework or build step:

1. Footer year (`#jaar`)
2. Mobile nav toggle (`.nav__toggle` / `#mobile-menu`, syncs `aria-expanded`)
3. Scroll-reveal via `IntersectionObserver` for any `.reveal` element (falls back to
   immediately showing content if unsupported)
4. Contact form (`form[data-mailto]` on `ateliers.html`) — client-side only, submits via
   a `mailto:` link (no backend). The README notes this may later move to a real email
   delivery service (Formspree/Resend) — no such integration exists yet.

## Known placeholders / intentional TODOs (per README)

- Fonts (Baloo 2 + Nunito) are temporary substitutes for the brandbook's real house
  fonts, which haven't been delivered yet. When they arrive, swap files in
  `assets/fonts/` + `css/fonts.css`; the rest of the site is expected to stay the same.
- The logo is an extracted PNG; an official SVG from DETLET would be ideal for crisp
  scaling.
- Opening hours / social links are placeholders pending real content.

## Git workflow

- Commit automatisch na elke voltooide en werkende wijziging, zonder te vragen.
  Gebruik een duidelijk, kort commit-bericht dat samenvat wat er is veranderd
  (bijv. "Add contact form to homepage", niet "update").
- Push NIET automatisch naar GitHub. Wacht altijd op expliciete toestemming
  van de gebruiker voordat je `git push` uitvoert.
- Als er iets kapot is of een fout oplevert, commit dan niet — meld dit eerst
  aan de gebruiker.
