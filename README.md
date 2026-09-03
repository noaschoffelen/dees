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
privacy.html          Privacybeleid
contact.html          Contact — adres, telefoon, e-mail, socials, kaart
api/
  ateliers-contact.js  Verstuurt het contactformulier via Resend
  crew-apply.js        Verstuurt het sollicitatieformulier via Resend (incl. cv/motivatie)
  _utils.js            Gedeelde helpers (validatie, rate limiting)
css/
  styles.css         Design-systeem (kleuren, type, componenten)
  fonts.css           Lokale @font-face (Serial B Neue: regular + heavy)
js/main.js            Mobiel menu, scroll-reveal, formulieren → eigen /api/* endpoints
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

`ateliers.html` en `crew.html` versturen naar hun eigen `/api/*` endpoint (Vercel
serverless functions), die de e-mail versturen via **Resend** — geen derde partij zoals
Formspree meer nodig. Het sollicitatieformulier stuurt cv en motivatiebrief gewoon mee
als bijlage in dezelfde e-mail. Vereist een geldige `RESEND_API_KEY` als environment
variable in Vercel (Production + Preview); lokaal testen kan alleen via `vercel dev`,
niet met de simpele Python-server. Zie `CLAUDE.md` voor de volledige architectuur
(DNS-opzet, rate limiting, validatie).

## URL's & SEO

`vercel.json` zet `cleanUrls` aan: pagina's zijn bereikbaar zonder `.html`
(`/menu` i.p.v. `menu.html`); dit werkt alleen op Vercel, niet met de lokale
Python-server. `robots.txt` + `sitemap.xml` staan in de root. Elke pagina heeft eigen
`title`/`description`/`og:*`-tags; de homepage heeft daarnaast structured data
(bedrijfsnaam, adres, telefoon, openingstijden, Instagram, Google Bedrijfsprofiel,
LinkedIn) voor Google.

## Nog te doen / bewuste keuzes

- Serial A (het slanke, schuine display-font uit het brandbook) is nog niet in gebruik —
  alleen trial-bestanden aanwezig in `brand/fonts/A/`, wacht op licentie.
- `privacy.html` is een eerlijke eerste versie, geen juridisch geverifieerde tekst.
- Het sollicitatieformulier op `crew.html` staat tijdelijk dicht (team is voltallig) —
  zet `SOLLICITATIES_OPEN` in `api/crew-apply.js` terug op `true` zodra dat weer mag.
- De site draait nog op Vercel's gratis **Hobby**-plan, terwijl de voorwaarden daarvan
  commercieel gebruik eigenlijk niet toestaan — overstappen naar Pro is aan de klant.
