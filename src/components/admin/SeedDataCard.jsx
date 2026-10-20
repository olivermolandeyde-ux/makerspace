import { useState } from "react"
import { seedStartData } from "../../lib/seed"
import { firebaseErrorMessage } from "../../lib/errors"
import { ErrorNotice, Spinner, SuccessNotice } from "../ui/Feedback"

export default function SeedDataCard() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleSeed() {
    const confirmed = window.confirm(
      "Fylle inn standardverdier i samlinger som er tomme? Eksisterende data endres ikke.",
    )
    if (!confirmed) return

    setRunning(true)
    setError(null)
    setResult(null)

    try {
      const summary = await seedStartData()
      setResult(summary)
    } catch (seedError) {
      console.error("Kunne ikke fylle inn startdata:", seedError)
      setError(
        firebaseErrorMessage(seedError, "Kunne ikke fylle inn startdata. Prøv igjen."),
      )
    } finally {
      setRunning(false)
    }
  }

  const added = result ? result.departments + result.materials + result.machines : 0

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-serif text-xl font-bold text-ink">Fyll inn startdata</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Legger inn skolens avdelinger, de vanligste maskinene og materialene. Knappen fyller
        bare samlinger som er helt tomme – eksisterende data blir ikke endret.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Standardverdiene inkluderer blant annet 3D-printer, laserkutter, koppresse og
        tekstilpresse. Vinylkutter får materialet Vinylfolie, og maskinen «Annet» kan bruke
        alle materialer.
      </p>

      {error && <ErrorNotice message={error} className="mt-4" />}
      {result && (
        <SuccessNotice
          className="mt-4"
          message={
            added > 0
              ? `La til ${result.departments} avdelinger, ${result.materials} materialer og ${result.machines} maskiner.`
              : "Alle samlingene hadde allerede data. Ingenting ble endret."
          }
        />
      )}

      <button
        type="button"
        onClick={handleSeed}
        disabled={running}
        className="btn-secondary mt-5 w-full sm:w-auto"
      >
        {running ? (
          <>
            <Spinner className="h-4 w-4" /> Fyller inn …
          </>
        ) : (
          "Fyll inn startdata"
        )}
      </button>
    </section>
  )
}
