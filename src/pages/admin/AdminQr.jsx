import { useMemo, useRef, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { ErrorNotice, PageHeader, SuccessNotice } from "../../components/ui/Feedback"

function buildRegistrationUrl(input) {
  const trimmed = input.trim()
  if (!trimmed) return { url: "", error: null }

  let candidate = trimmed
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`
  }
  candidate = candidate.replace(/\/+$/, "")
  if (!/\/registrer$/i.test(candidate)) {
    candidate = `${candidate}/registrer`
  }

  try {
    const parsed = new URL(candidate)
    if (!parsed.hostname) {
      return { url: "", error: "Skriv inn et gyldig domene, for eksempel makerspace.skole.no." }
    }
    return { url: parsed.toString(), error: null }
  } catch {
    return { url: "", error: "Skriv inn et gyldig domene, for eksempel makerspace.skole.no." }
  }
}

export default function AdminQr() {
  const [domain, setDomain] = useState(() => window.location.origin)
  const [downloadMessage, setDownloadMessage] = useState(null)
  const [downloadError, setDownloadError] = useState(null)
  const canvasRef = useRef(null)
  const result = useMemo(() => buildRegistrationUrl(domain), [domain])

  const isLocalhost = useMemo(() => {
    if (!result.url) return false
    try {
      const hostname = new URL(result.url).hostname
      return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
    } catch {
      return false
    }
  }, [result.url])

  function handleDownload() {
    if (!result.url || !canvasRef.current) return

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = "makerspace-qr-registrer.png"
      document.body.appendChild(link)
      link.click()
      link.remove()
      setDownloadError(null)
      setDownloadMessage("QR-koden er lastet ned som PNG.")
    } catch (error) {
      console.error("Kunne ikke laste ned QR-koden:", error)
      setDownloadMessage(null)
      setDownloadError("Kunne ikke laste ned QR-koden. Prøv igjen.")
    }
  }

  function handlePrint() {
    if (!result.url) return
    window.print()
  }

  return (
    <>
      <div className="no-print">
        <PageHeader
          eyebrow="QR-kode"
          title="QR-kode til registrering"
          description="Skriv inn nettadressen til Makerspace-siden. QR-koden peker alltid til /registrer, slik at lærere kommer rett til skjemaet."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="card no-print h-fit p-5 sm:p-6">
          <h2 className="font-serif text-xl font-bold text-ink">Adresse</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Bruk domenet der nettsiden er publisert. Er du på localhost nå, må du bytte til den
            offentlige adressen før QR-koden henges opp.
          </p>

          <div className="mt-4">
            <label htmlFor="qr-domain" className="field-label">
              Domene
            </label>
            <input
              id="qr-domain"
              type="text"
              inputMode="url"
              className="field-input"
              placeholder="makerspace.skole.no"
              value={domain}
              onChange={(event) => {
                setDomain(event.target.value)
                setDownloadMessage(null)
                setDownloadError(null)
              }}
            />
            {result.error && <p className="mt-1.5 text-sm font-medium text-danger">{result.error}</p>}
            {result.url && (
              <p className="mt-2 break-all rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                QR-koden peker til: <span className="font-semibold text-ink">{result.url}</span>
              </p>
            )}
          </div>

          {isLocalhost && (
            <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
              Du bruker en lokal adresse. Den virker bare på denne maskinen. Bytt til den
              publiserte adressen før du laster ned eller skriver ut.
            </div>
          )}

          {downloadError && <ErrorNotice message={downloadError} className="mt-4" />}
          {downloadMessage && <SuccessNotice message={downloadMessage} className="mt-4" />}

          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              className="btn-primary w-full"
              onClick={handleDownload}
              disabled={!result.url}
            >
              Last ned som PNG
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={handlePrint}
              disabled={!result.url}
            >
              Skriv ut
            </button>
          </div>
        </section>

        <section className="card print-page flex flex-col items-center bg-white px-6 py-8 text-center sm:px-10 sm:py-10">
          <p className="font-serif text-2xl font-bold text-ink">Makerspace</p>
          <h2 className="mt-1 font-serif text-3xl font-bold text-ink">Registrer forbruk</h2>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Skann QR-koden med mobilkameraet og fyll ut skjemaet etter at du har brukt en maskin.
          </p>

          <div className="mt-6 w-full max-w-[360px] rounded-2xl border-8 border-brand-500 bg-white p-3 sm:max-w-[400px]">
            {result.url ? (
              <QRCodeCanvas
                ref={canvasRef}
                value={result.url}
                size={1024}
                level="H"
                marginSize={4}
                bgColor="#ffffff"
                fgColor="#1f2937"
                title={`QR-kode til ${result.url}`}
                style={{ width: "100%", height: "auto" }}
                className="block h-auto w-full"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-sm text-muted">
                Skriv inn et gyldig domene
              </div>
            )}
          </div>

          <p className="mt-5 break-all text-sm font-semibold text-ink">
            {result.url || "Ingen gyldig adresse"}
          </p>
          <p className="mt-2 text-xs text-muted">QR-koden kan skrives ut og henges ved maskinene.</p>
        </section>
      </div>
    </>
  )
}
