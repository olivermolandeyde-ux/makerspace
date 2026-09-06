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
