const MISSING_CONFIG =
  "Firebase er ikke konfigurert. Kopier .env.example til .env og fyll inn VITE_FIREBASE_*-verdiene."

export function firebaseErrorMessage(error, fallback = "Noe gikk galt. Prøv igjen.") {
  const code = error?.code || ""

  switch (code) {
    case "permission-denied":
      return "Du har ikke tilgang til dette. Sjekk at du er innlogget som administrator, eller kontakt en administrator."
    case "unauthenticated":
      return "Du er ikke innlogget. Logg inn på nytt som administrator."
    case "unavailable":
      return "Får ikke kontakt med databasen. Sjekk nettverket og prøv igjen."
    case "failed-precondition":
      return "Databasen er ikke klar. Sjekk at Firestore er slått på i Firebase Console."
    case "not-found":
      return "Fant ikke det du lette etter. Det kan ha blitt slettet."
    case "resource-exhausted":
      return "For mange forespørsler akkurat nå. Vent litt og prøv igjen."
    case "invalid-api-key":
    case "auth/invalid-api-key":
      return MISSING_CONFIG
    default:
      return fallback
  }
}

export function authErrorMessage(error) {
  const code = error?.code || ""

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Feil e-post eller passord. Prøv igjen."
    case "auth/invalid-email":
      return "E-postadressen er ikke gyldig."
    case "auth/user-disabled":
      return "Denne brukeren er deaktivert. Kontakt administrator."
    case "auth/too-many-requests":
      return "For mange innloggingsforsøk. Vent litt og prøv igjen."
    case "auth/network-request-failed":
      return "Får ikke kontakt med innloggingstjenesten. Sjekk nettverket."
    case "auth/invalid-api-key":
    case "auth/configuration-not-found":
      return MISSING_CONFIG
    case "auth/operation-not-allowed":
      return "E-post/passord-innlogging er ikke slått på i Firebase Console."
    default:
      return "Innloggingen mislyktes. Sjekk e-post og passord, og prøv igjen."
  }
}

export { MISSING_CONFIG }
