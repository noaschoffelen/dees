# Dees — website

Statische website voor **Dees** — brood • ateliers • koffie, Korte Tuinstraat 20-22, Tilburg.
Gebouwd op basis van het brandbook (`brand/`, DETLET).

## Lokaal bekijken

Geen build-stap nodig. Start een simpele webserver in de root van dit project:

```bash
python3 -m http.server 8080
```

Open daarna **http://localhost:8080** in je browser.

(Alternatief: `npx serve .` — daarmee draait het ook.)

## Hosting

De site staat op Vercel, gekoppeld aan deze GitHub-repo (root als brondirectory, geen
build command nodig). Custom domain: `deestilburg.nl`.

## Structuur

```
index.html          Home — "Ken je Dees?"
menu.html            Menu (Coming Soon)
ateliers.html        Ateliers + contactformulier
crew.html            Dees Crew + sollicitatieformulier
vergaderen.html       Vergaderen (Coming Soon)
css/
  styles.css         Design-systeem (kleuren, type, componenten)
  fonts.css           Lokale @font-face (Serial B Neue: regular + heavy)
js/main.js            Mobiel menu, scroll-reveal, formulieren → Formspree
assets/
  fonts/              Lokaal gehoste webfonts (.woff2/.woff)
  img/                Logo's (SVG), handjes, foto's

brand/                Bronmateriaal (brandbook, logo-varianten, fonts, moodboard)
```

## Merk-uitgangspunten (uit het brandbook)

- **Kleuren:** lichtblauw `#94C5ED`, rood `#F11F0A`, paars `#5F1B47`, zwart, wit.
- **Payoff:** brood • ateliers • koffie.
- **Motief:** wijzende handjes, kleurblokken, handgemaakt/imperfect gevoel.
- **Font:** Serial B Neue (regular voor lopende tekst, heavy voor koppen).
- **Logo:** officiële SVG-varianten van DETLET in `assets/img/logo/` en `brand/logo/`.

## Contactformulieren

`ateliers.html` en `crew.html` versturen via Formspree (echte e-mailbezorging, geen
mailto meer). Het sollicitatieformulier op `crew.html` ondersteunt cv/motivatie-uploads
zodra bestandsuploads aanstaan in de Formspree-forminstellingen.

## Nog te doen / bewuste keuzes

- **Openingstijden** staan als placeholder — nog aan te leveren.
- Serial A (het slanke, schuine display-font uit het brandbook) is nog niet in gebruik —
  alleen trial-bestanden aanwezig in `brand/fonts/A/`, wacht op licentie.
