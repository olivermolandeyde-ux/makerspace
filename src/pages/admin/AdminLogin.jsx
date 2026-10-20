import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import Navbar from "../../components/Navbar"
import { ErrorNotice, LoadingBlock, Spinner } from "../../components/ui/Feedback"
import { useAuth } from "../../context/useAuth"
import { isFirebaseConfigured } from "../../firebase"
import { MISSING_CONFIG, authErrorMessage } from "../../lib/errors"

export default function AdminLogin() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const destination = location.state?.from || "/admin"

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <LoadingBlock label="Sjekker innlogging …" />
      </div>
    )
  }

  if (user) {
    return <Navigate to={destination} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError("Fyll inn både e-post og passord.")
      return
    }

    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate(destination, { replace: true })
    } catch (loginError) {
      console.error("Innlogging feilet:", loginError)
      setError(authErrorMessage(loginError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto flex w-full max-w-md flex-col px-4 py-10 sm:py-16">
        <div className="mb-6 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
            Administrasjon
          </p>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">Logg inn</h1>
          <p className="mt-2 text-base text-muted">
            Kun for administratorer av Makerspace.
          </p>
        </div>

        {!isFirebaseConfigured && (
          <ErrorNotice
            message={MISSING_CONFIG}
            className="mb-5"
            details="Opprett en .env-fil i prosjektmappen. Se README for oppsett i Firebase Console."
          />
        )}

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="field-label">
                E-post
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                className="field-input"
                placeholder="admin@skolen.no"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Passord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="field-input"
                placeholder="Passord"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error && <ErrorNotice message={error} />}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner /> Logger inn …
                </>
              ) : (
                "Logg inn"
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <Link to="/registrer" className="font-semibold text-ink hover:text-brand-700">
            Til registrering av forbruk
          </Link>
          <Link to="/" className="text-muted hover:text-ink">
            Tilbake til forsiden
          </Link>
        </div>
      </main>
    </div>
  )
}
