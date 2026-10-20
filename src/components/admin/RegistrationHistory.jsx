import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { formatDateTime, formatNOK, formatQuantity, toDate } from "../../lib/cost"
import { useCollection } from "../../lib/useCollection"
import { EmptyState, ErrorNotice, LoadingBlock, PageHeader } from "../ui/Feedback"

function timeValue(registration) {
  return toDate(registration.date)?.getTime() || 0
}

export default function RegistrationHistory() {
  const { items, loading, error } = useCollection("registrations")
  const [query, setQuery] = useState("")

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => timeValue(b) - timeValue(a)),
    [items],
  )

  const visibleItems = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return sortedItems
    return sortedItems.filter((registration) =>
      [
        registration.teacherName,
        registration.departmentName,
        registration.machineName,
        registration.materialName,
      ].some((value) => String(value || "").toLowerCase().includes(search)),
    )
  }, [sortedItems, query])

  const totalCost = useMemo(
    () =>
      Math.round(
        visibleItems.reduce((sum, registration) => sum + (Number(registration.cost) || 0), 0) * 100,
      ) / 100,
    [visibleItems],
  )

  return (
    <>
      <PageHeader
        eyebrow="Historikk"
        title="Alle registreringer"
        description="Nyeste registrering først. Navn, enhet og pris vises slik de var da registreringen ble lagret."
      >
        <Link to="/admin/rapporter" className="btn-primary">
          Lag rapport
        </Link>
      </PageHeader>

      {error && <ErrorNotice message={error} className="mb-6" />}

      <section className="card mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-md">
            <label htmlFor="history-search" className="field-label">
              Søk
            </label>
            <input
              id="history-search"
              type="search"
              className="field-input"
              placeholder="Navn, avdeling, maskin eller materiale"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Viser</p>
              <p className="mt-1 font-serif text-xl font-bold text-ink">{visibleItems.length}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Sum</p>
              <p className="mt-1 font-serif text-xl font-bold text-ink">{formatNOK(totalCost)}</p>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="card">
          <LoadingBlock label="Henter registreringer …" />
        </div>
      ) : visibleItems.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "Ingen registreringer ennå" : "Ingen treff"}
          description={
            items.length === 0
              ? "Når lærere registrerer forbruk, dukker det opp her."
              : "Prøv et annet søkeord."
          }
        >
          <Link to="/registrer" className="btn-primary">
            Åpne registreringsskjema
          </Link>
        </EmptyState>
      ) : (
        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[980px]">
              <thead>
                <tr>
                  <th scope="col">Dato</th>
                  <th scope="col">Lærer</th>
                  <th scope="col">Avdeling</th>
                  <th scope="col">Maskin</th>
                  <th scope="col">Materiale</th>
                  <th scope="col" className="text-right">
                    Mengde
                  </th>
                  <th scope="col" className="text-right">
                    Kostnad
                  </th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((registration) => (
                  <tr key={registration.id}>
                    <td className="whitespace-nowrap">{formatDateTime(registration.date)}</td>
                    <td className="whitespace-nowrap font-medium text-ink">
                      {registration.teacherName || "–"}
                    </td>
                    <td>{registration.departmentName || "–"}</td>
                    <td>{registration.machineName || "–"}</td>
                    <td>{registration.materialName || "–"}</td>
                    <td className="whitespace-nowrap text-right tabular-nums">
                      {formatQuantity(registration.amount)} {registration.unit || ""}
                    </td>
                    <td className="whitespace-nowrap text-right font-semibold tabular-nums text-ink">
                      {formatNOK(registration.cost)}
                    </td>
                    <td>
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                          registration.approved === true
                            ? "bg-success-soft text-success"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {registration.approved === true ? "Godkjent" : "Ikke godkjent"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold text-ink">
                  <td colSpan="6" className="px-4 py-3">
                    Totalt {visibleItems.length} registreringer
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatNOK(totalCost)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
