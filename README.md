# Dees — website (eerste versie)

Statische website voor **Dees** — brood • ateliers • koffie, Korte Tuinstraat 20-22, Tilburg.
Gebouwd op basis van het brandbook (`brand/Dees-Branding-v2.pdf`, DETLET v2).

## Lokaal bekijken

Geen build-stap nodig. Start een simpele webserver in de `site/`-map:

```bash
cd site
python3 -m http.server 8080
```

Open daarna **http://localhost:8080** in je browser.

(Alternatief: `npx serve site` — daarmee draait het ook.)

## Structuur

```
site/
├── index.html          Home — "Ken je Dees?"
├── menu.html           Menu (echt menu uit het brandbook)
├── ateliers.html       Ateliers + contactformulier
├── crew.html           Dees Crew
├── vergaderen.html     Vergaderen (Coming Soon)
├── css/
│   ├── styles.css      Design-systeem (kleuren, type, componenten)
│   └── fonts.css       Lokale @font-face (Baseline: Baloo 2 + Nunito)
├── js/main.js          Mobiel menu, scroll-reveal, formulier → mailto
└── assets/
    ├── fonts/          Lokaal gehoste webfonts (.woff2)
    └── img/            Logo's, handjes, foto's (uit het brandbook gehaald)

brand/                  Bronmateriaal (brandbook-PDF + drop-mappen)
```

## Merk-uitgangspunten (uit het brandbook)

- **Kleuren:** lichtblauw `#94C5ED`, rood `#F11F0A`, paars `#5F1B47`, zwart, wit.
- **Payoff:** brood • ateliers • koffie.
- **Motief:** wijzende handjes, kleurblokken, handgemaakt/imperfect gevoel.
- **Logo & foto's:** rechtstreeks uit het brandbook geëxtraheerd (transparante PNG's
  in `assets/img/logo` en `assets/img/hands`, foto's in `assets/img/photo`).

## Nog te doen / bewuste keuzes (v1)

- **Fonts zijn tijdelijk.** Het brandbook gebruikt twee huisfonts ("Serial A" display +
  "Serial B" rounded). Die zijn nog niet als bestand aangeleverd. Nu staan er nette
  substituten: **Baloo 2** (display) en **Nunito** (body). Zodra de echte fonts er zijn,
  vervangen we ze in `assets/fonts/` + `css/fonts.css` — de rest van de site blijft gelijk.
- **Contactformulier** opent het mailprogramma van de bezoeker (mailto naar
  info@deestilburg.nl). Later eventueel te vervangen door echte e-mailbezorging
  (Formspree/Resend).
- **Menu** is gevuld met het echte menu uit het brandbook. Makkelijk aan te passen in
  `menu.html`.
- **Openingstijden / social media** staan als placeholder — nog aan te leveren.
- Het **logo** is nu een geëxtraheerde PNG. Voor perfecte scherpte op elk formaat is een
  officieel **SVG-logo** van DETLET ideaal.
