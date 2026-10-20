# site-template

Gjenbrukbar startmal basert på oppsettet fra det tidligere prosjektet
(`makerspase-site` / BubbleBubbleGum). Samme byggeverktøy, samme
mappestruktur og samme kode-mønster (routing, handlekurv, PayPal,
Firebase-innlogging) — men uten innhold, nøkler eller bilder som var
spesifikke for det gamle prosjektet.

## Stack

- Vite 8 + React 19
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- React Router 7
- Framer Motion (parallax-hero)
- Firebase Auth (innlogging/registrering)
- PayPal (`@paypal/react-paypal-js`) for betaling i handlekurven

## Kom i gang med et nytt prosjekt

1. Kopier hele denne mal-mappen til et nytt navn/sted.
2. `npm install`
3. `cp .env.example .env` og fyll inn dine egne Firebase- og
   PayPal-nøkler (se under). Uten dette vil ikke innlogging eller
   betaling fungere, men resten av siten kjører fint.
4. `npm run dev`

Trenger du ikke Firebase eller PayPal i det nye prosjektet, kan du
bare la de tilhørende feltene i `.env` stå tomme, eller fjerne
`Login`/`SignUp`/`CartSummary`-komponentene og `PayPalScriptProvider`
i `App.jsx`.

## Hvorfor `.env` og ikke hardkodede nøkler

I det originale prosjektet lå Firebase-konfigurasjonen og
PayPal-client-ID direkte i kildekoden. Det er fjernet herfra og
flyttet til miljøvariabler (`VITE_...` i `.env`), slik at malen kan
brukes på nytt uten at gamle/virkelige nøkler følger med, og slik at
`.env` ikke havner i git (den er lagt i `.gitignore`).

## Struktur

```
src/
  App.jsx            – Router, cart-state (localStorage), PayPal-provider
  firebase.js        – Firebase-oppsett, leser fra .env
  pages/
    Home.jsx         – forside (Navbar + Hero + ProductList)
    About.jsx        – enkel placeholder-side
    Cart.jsx         – innlogging/registrering
    Checkout.jsx      – handlekurv-oppsummering + PayPal-knapper
  components/
    Navbar.jsx        – responsiv navbar m/ mobilmeny og cart-teller
    Hero.jsx          – parallax-hero (framer-motion)
    Login.jsx / SignUp.jsx – Firebase-autentisering
    ProductList.jsx   – produktgrid, placeholder-data
    CartSummary.jsx   – handlekurv + PayPal-betaling
  assets/             – tom, legg egne bilder her
```

## Ting å bytte ut per nytt prosjekt

- `Site Name` i `Navbar.jsx` og tittel i `index.html`
- Fargetema (nå `indigo`/`slate` Tailwind-klasser — søk/erstatt)
- Placeholder-produktene i `ProductList.jsx`
- Legg inn ekte bilder i `src/assets/` og importer dem der du vil
  ha dem (f.eks. i `Hero.jsx` eller `Home.jsx`, samme mønster som i
  det gamle prosjektet: `import bg from '../assets/bg.jpg'`)

## Ikke inkludert fra det gamle prosjektet

- Ekte Firebase- og PayPal-nøkler (bevisst fjernet)
- Produktbilder og bakgrunnsbilder (var 13+ MB, prosjekt-spesifikke)
- Prosjektnavnet "BubbleBubbleGum" og norsk sidenavn "Tjenester"

---

# Forbruksregistrering i Makerspace

Systemet lar lærere registrere forbruksmateriell fra mobil, uten innlogging.
Kostnaden beregnes automatisk og lagres sammen med navn, enhet og pris.
Administrator kan styre grunndata, se historikk og lage rapporter og
fakturagrunnlag for intern fakturering.

## Nye ruter

| Rute | Innhold |
| --- | --- |
| `/registrer` | Åpent registreringsskjema for lærere (mobil først) |
| `/admin/login` | Innlogging med Firebase Auth (e-post/passord) |
| `/admin` | Beskyttet oversikt med startdata og hurtiglenker |
| `/admin/materialer` | Materialregister |
| `/admin/maskiner` | Maskinregister med materialkobling |
| `/admin/avdelinger` | Avdelingsregister |
| `/admin/historikk` | Alle registreringer, nyeste først |
| `/admin/rapporter` | Rapporter, Excel-eksport og fakturagrunnlag |
| `/admin/qr` | QR-kode til `/registrer`, PNG-nedlasting og utskrift |

## Pakker som er lagt til

- `xlsx` – eksport til Excel (lastes dynamisk, slik at hovedbunten holdes mindre)
- `qrcode.react` – QR-kode som canvas/SVG

Ingen andre pakker er installert for dette.

## 1. Slå på Firebase

Du trenger et Firebase-prosjekt med **Authentication** og **Firestore**.

### a. Miljøvariabler

1. Kopier malen: `cp .env.example .env`
2. I Firebase Console: **Prosjektinnstillinger (tannhjulet) → Generelt → Dine apper**.
3. Opprett en web-app hvis det ikke finnes, og kopier `firebaseConfig`-verdiene.
4. Fyll inn i `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`.env` ligger i `.gitignore` og skal ikke committes. Start `npm run dev` på nytt
etter at filen er opprettet eller endret.

### b. Slå på e-post/passord-innlogging

1. Firebase Console → **Authentication** → **Sign-in method**.
2. Velg **Email/Password** → **Enable** → **Save**.

### c. Opprett admin-bruker

1. Firebase Console → **Authentication** → **Users**.
2. Klikk **Add user**.
3. Skriv inn e-post og passord, og opprett brukeren.
4. Logg inn på `/admin/login` med samme e-post og passord.

Det finnes ingen offentlig registrering av administratorer. Alle brukere som
opprettes i Firebase Authentication får administratortilgang, fordi reglene
krever `request.auth != null`. Opprett derfor bare kontoer til betrodde
ansatte, og ikke slå på selvregistrering.

### d. Slå på Firestore

1. Firebase Console → **Firestore Database** → **Create database**.
2. Velg en region nær Norge, for eksempel `europe-west3`.
3. Velg **Production mode** (anbefalt).
4. Samlingene `departments`, `machines`, `materials` og `registrations`
   opprettes automatisk ved første skriving. Du trenger ikke lage dem manuelt.

### e. Last opp sikkerhetsreglene

Reglene ligger i `firestore.rules` i prosjektroten. Enkleste metode:

1. Åpne Firebase Console → **Firestore Database** → **Rules**.
2. Kopier hele innholdet i `firestore.rules`.
3. Lim det inn i editoren, og klikk **Publish**.

Reglene gjelder med en gang. Med Firebase CLI kan du gjøre det samme slik
(forutsetter at prosjektet er koblet til Firebase CLI):

```bash
npx firebase-tools deploy --only firestore:rules
```

Kort forklart gjør reglene dette:

- Alle kan **lese** avdelinger, maskiner og materialer (trengs i skjemaet).
- Bare innloggede administratorer kan **skrive** disse samlingene.
- Alle kan **opprette** en registrering, men bare dersom `approved == true`,
  `amount > 0` og `cost` er et gyldig tall. Øvrige felt må være utfylt.
- Bare innloggede kan **lese, endre eller slette** registreringer. Dermed er
  historikk og rapporter beskyttet.

## 2. Start og fyll inn startdata

```bash
npm install
npm run dev
```

1. Logg inn på `/admin/login`.
2. Gå til **Oversikt** og klikk **Fyll inn startdata**.
3. Knappen fyller bare samlinger som er helt tomme. Eksisterende data endres
   ikke. Du kan trykke den flere ganger uten å få duplikater.

Standardverdiene inneholder avdelingene fra oppdraget, maskinene 3D-printer,
Laserkutter, Koppresse, Tekstilpresse, Vinylkutter, Sublimeringsprinter og
Annet, samt materialene som hører til. Eksempelprisene er PLA 300 kr/kg,
PETG 350 kr/kg, Kryssfinerplate 3 mm 65 kr/plate og Sublimeringskopp 18 kr/stk.
Øvrige priser settes til 0 og kan fylles ut i materialregisteret.

For at Vinylkutter og de øvrige maskinene også skal være brukbare, legger
startdataene inn materialet **Vinylfolie** (0 kr/meter), kobler
Sublimeringspapir til Sublimeringsprinteren, og lar **Annet** kunne bruke alle
materialene. Dette kan endres fritt i maskinregisteret.

## 3. Datamodell og prissnapshot

- `departments`: `name`, `active`, `createdAt`
- `machines`: `name`, `materialIds`, `active`
- `materials`: `name`, `unit`, `pricePerUnit`, `active`
- `registrations`: `date`, `teacherName`, `departmentId`, `departmentName`,
  `machineId`, `machineName`, `materialId`, `materialName`, `unit`, `amount`,
  `pricePerUnit`, `cost`, `approved`

`date` settes med `serverTimestamp()`. Navn, enhet og pris **kopieres** inn i
hver registrering. Endrer du en pris eller et navn senere, påvirker det bare
nye registreringer – gamle rapporter og fakturagrunnlag beholder verdiene fra
registreringstidspunktet.

Mengder lagres i materialets grunnenhet. Skriver læreren 250 gram PLA, lagres
`amount = 0.25` med `unit = "kg"` og kostnaden beregnes som `0.25 × 300`.

## 4. Rapporter, Excel og PDF

- **Rapporter** har fanene *Per avdeling*, *Per materiale*, *Per lærer* og
  *Fakturagrunnlag*.
- Filteret støtter dato fra/til, avdeling, maskin, materiale og lærer.
- Hver visning kan eksporteres til `.xlsx`. **Eksporter alle visninger** lager
  én arbeidsbok med flere ark, inkludert detaljert registreringsliste.
- **Fakturagrunnlag** bruker periode og avdeling, viser materiale, mengde og
  beløp med sum, og kan skrives ut. Velg **Lagre som PDF** i utskriftsdialogen
  for å lage PDF. Utskriften skjuler meny, filtre og knapper automatisk.

## 5. QR-kode

Gå til **Admin → QR-kode**. Adressen fylles ut fra `window.location.origin`,
men kan endres til det publiserte domenet. QR-koden peker alltid til
`/registrer`. Du kan laste ned PNG i 1024 × 1024 piksler og skrive ut siden.
Bytter du til et offentlig domene før utskrift, virker koden også for elever og
lærere som ikke sitter på samme maskin.

## 6. Designprofil

Alt er samlet i `@theme` i `src/index.css`, slik at profilen enkelt kan endres.

| Bruk | Farge |
| --- | --- |
| Primærfarge (knapper, valgt fane) | `#EAB308` (brand-500, tilsvarer gul-500) |
| Hover på primærknapp | `#CA8A04` (brand-600) |
| Lys gul bakgrunn | `#FEF9C3` (brand-100) |
| Navbar (uendret) | `#EDE8E8F2` |
| Sidebakgrunn | `#F9FAFB` (gray-50) |
| Tekst | `#1F2937` |
| Suksess | `#15803D` |
| Feil | `#B91C1C` |

Fonter:

- **Lora** (600/700) – serif, brukes i logo og overskrifter. Viderefører den
  serif-logoen som allerede fantes.
- **Inter** (400–800) – brødtekst og skjemafelt.

Begge lastes fra Google Fonts i `index.html` og er definert som `--font-serif`
og `--font-sans` i `src/index.css`.

## 7. Test at alt virker

1. `npm run build` og `npm run lint` skal gå uten feil.
2. Åpne `/registrer` på mobil eller i smal nettleser. Velg avdeling, maskin og
   materiale. Skriv for eksempel `250`, velg **gram**, og se at kostnaden
   oppdateres. Send-knappen skal være deaktivert til avkrysningsboksen er huket
   av. Etter sending vises sammendrag og **Registrer ny**.
3. Logg inn på `/admin/login`. Uten innlogging skal `/admin` sende deg til
   innloggingssiden.
4. Klikk **Fyll inn startdata**. Sjekk at det kommer avdelinger, materialer og
   maskiner. Trykk igjen: da skal ingenting dupliseres.
5. Endre en pris i materialregisteret. Gamle registreringer i historikken skal
   fortsatt vise den gamle prisen.
6. Deaktiver en avdeling eller maskin. Den skal forsvinne fra `/registrer`, men
   fortsatt finnes i historikk og rapporter.
7. Lag et fakturagrunnlag: velg periode og avdeling, sjekk summer, eksporter
   til Excel og skriv ut / lagre som PDF.
8. Last ned QR-koden, skann den med mobilen og kontroller at den åpner
   `/registrer`.
9. Test sikkerheten: Åpne nettleserens utviklerverktøy mens du er logget ut.
   Lesing av `registrations` skal bli avvist, mens oppretting med
   `approved: true` og gyldige felt skal fungere.

## 8. Deploy til Vercel

`.env` ligger ikke i Git og blir derfor ikke med når Vercel bygger fra GitHub.
Vite leser `VITE_*`-variablene på byggetidspunktet, så de må legges inn som
miljøvariabler i Vercel:

1. Åpne prosjektet i Vercel og gå til **Settings → Environment Variables**.
2. Legg inn disse for **Production** (og gjerne **Preview**):

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

3. Lagre og **redeploy** prosjektet. Variablene må være med under bygget.
4. `vercel.json` sørger for at `/registrer`, `/admin` og andre ruter fungerer
   når de åpnes direkte eller lastes på nytt.
5. Legg Vercel-domenet til i **Firebase Console → Authentication → Settings →
   Authorized domains**.

Uten miljøvariablene viser den deployede siden «Firebase er ikke konfigurert»,
selv om den virker på `localhost`.

## Viktig om sikkerhet

Offentlig oppretting er bevisst tillatt for at lærere skal slippe innlogging.
Reglene begrenser hvilke felt og verdier som kan skrives, men hvem som helst
som kjenner prosjektadressen kan i teorien sende en registrering med gyldige
felt. Til skolebruk er dette en avveining for å få skjemaet raskt og enkelt.
Hvis dere senere ønsker sterkere kontroll, kan man legge til en egen
anonym Firebase-innlogging eller en invitasjonskode. Alle som er opprettet i
Firebase Authentication, bør være betrodde administratorer.
