import { useMemo } from "react"
import { Link } from "react-router-dom"
import { formatNOK } from "../../lib/cost"
import { useCollection } from "../../lib/useCollection"
import SeedDataCard from "../../components/admin/SeedDataCard"
import { ErrorNotice, PageHeader } from "../../components/ui/Feedback"

function StatCard({ label, value, detail, to }) {
  return (
    <Link
      to={to}
      className="card flex flex-col justify-between gap-3 p-5 transition hover:border-brand-300 hover:shadow-md"
    >
      <span className="text-sm font-semibold text-muted">{label}</span>
      <span className="font-serif text-3xl font-bold text-ink">{value}</span>
      <span className="text-xs text-muted">{detail}</span>
    </Link>
  )
}

export default function AdminHome() {
  const departments = useCollection("departments")
  const machines = useCollection("machines")
  const materials = useCollection("materials")
  const registrations = useCollection("registrations")

  const totalCost = useMemo(
    () =>
      registrations.items.reduce((sum, registration) => sum + (Number(registration.cost) || 0), 0),
    [registrations.items],
  )

  const error = departments.error || machines.error || materials.error || registrations.error
  const loading = departments.loading || machines.loading || materials.loading || registrations.loading

  return (
    <>
      <PageHeader
        eyebrow="Administrasjon"
        title="Oversikt"
        description="Administrer grunnlaget for forbruksregistrering, se historikk og lag rapporter og fakturagrunnlag."
      >
        <Link to="/registrer" className="btn-primary">
          Åpne registreringsskjema
        </Link>
      </PageHeader>

      {error && <ErrorNotice message={error} className="mb-6" />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Avdelinger"
          value={loading ? "…" : departments.items.length}
          detail={`${departments.items.filter((item) => item.active !== false).length} aktive`}
          to="/admin/avdelinger"
        />
        <StatCard
          label="Maskiner"
          value={loading ? "…" : machines.items.length}
          detail={`${machines.items.filter((item) => item.active !== false).length} aktive`}
          to="/admin/maskiner"
        />
        <StatCard
          label="Materialer"
          value={loading ? "…" : materials.items.length}
          detail={`${materials.items.filter((item) => item.active !== false).length} aktive`}
          to="/admin/materialer"
        />
        <StatCard
          label="Registreringer"
          value={loading ? "…" : registrations.items.length}
          detail={`${formatNOK(totalCost)} totalt`}
          to="/admin/historikk"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <SeedDataCard />

        <section className="card p-5 sm:p-6">
          <h2 className="font-serif text-xl font-bold text-ink">Kom raskt i gang</h2>
          <ol className="mt-4 space-y-4 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                1
              </span>
              <span>
                Fyll inn startdata, eller legg inn avdelinger, materialer og maskiner manuelt.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                2
              </span>
              <span>
                Sjekk at maskinene har riktige materialer koblet til.{" "}
                <Link to="/admin/maskiner" className="font-semibold text-ink underline">
                  Gå til maskiner
                </Link>
                .
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                3
              </span>
              <span>
                Lag QR-koden og heng den ved maskinene.{" "}
                <Link to="/admin/qr" className="font-semibold text-ink underline">
                  Gå til QR-kode
                </Link>
                .
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                4
              </span>
              <span>
                Bruk rapportene til intern fakturering.{" "}
                <Link to="/admin/rapporter" className="font-semibold text-ink underline">
                  Gå til rapporter
                </Link>
                .
              </span>
            </li>
          </ol>

          <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-xs leading-relaxed text-muted">
            Tips: Hvis du endrer en pris, påvirker det bare nye registreringer. Gamle
            registreringer beholder prisen og navnet de ble lagret med.
          </div>
        </section>
      </div>
    </>
  )
}
