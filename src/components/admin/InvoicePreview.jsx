import { formatDate, formatNOK, formatQuantity, startOfLocalDay } from "../../lib/cost"
import { EmptyState } from "../ui/Feedback"

function periodLabel(from, to) {
  const fromDate = startOfLocalDay(from)
  const toDate = startOfLocalDay(to)

  if (fromDate && toDate) return `${formatDate(fromDate)} – ${formatDate(toDate)}`
  if (fromDate) return `Fra ${formatDate(fromDate)}`
  if (toDate) return `Til ${formatDate(toDate)}`
  return "Alle registreringer"
}

export default function InvoicePreview({ department, groups, registrationCount, filters, total }) {
  const period = periodLabel(filters.from, filters.to)

  return (
    <section className="card print-page mt-6 overflow-hidden bg-white">
      <div className="border-b-4 border-brand-500 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-serif text-2xl font-bold tracking-tight text-ink">Makerspace</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-ink">Fakturagrunnlag</h2>
            <p className="mt-1 text-sm text-muted">Intern fakturering av forbruksmateriell</p>
          </div>
          <div className="text-sm text-gray-600 sm:text-right">
            <p>
              <span className="font-semibold text-ink">Utarbeidet:</span> {formatDate(new Date())}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-ink">Periode:</span> {period}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8">
        <div className="grid gap-4 rounded-2xl bg-gray-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Avdeling</p>
            <p className="mt-1 font-semibold text-ink">
              {department ? department.name : "Ikke valgt"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Registreringer
            </p>
            <p className="mt-1 font-semibold text-ink">{registrationCount}</p>
          </div>
        </div>

        {!department ? (
          <div className="mt-6">
            <EmptyState
              title="Velg avdeling for å lage fakturagrunnlag"
              description="Velg periode og avdeling i filteret over. Da vises materialer, mengder og sum klart for utskrift eller Excel."
            />
          </div>
        ) : groups.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Ingen registreringer i perioden"
              description="Prøv å endre datointervallet eller velg en annen avdeling."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="border-b-2 border-ink text-left">
                  <th scope="col" className="py-3 pr-4 font-semibold text-ink">
                    Materiale
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-ink">
                    Mengde
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-ink">
                    Enhet
                  </th>
                  <th scope="col" className="py-3 pl-4 text-right font-semibold text-ink">
                    Beløp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groups.map((group) => (
                  <tr key={group.id} className="break-inside-avoid">
                    <td className="py-3 pr-4 font-medium text-ink">{group.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatQuantity(group.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{group.unit}</td>
                    <td className="py-3 pl-4 text-right font-semibold tabular-nums text-ink">
                      {formatNOK(group.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink">
                  <td colSpan="3" className="py-4 pr-4 text-right font-semibold text-ink">
                    Sum å fakturere
                  </td>
                  <td className="py-4 pl-4 text-right font-serif text-xl font-bold text-ink">
                    {formatNOK(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs leading-relaxed text-muted">
          Grunnlaget er basert på lagrede registreringer. Navn, enhet og pris er hentet fra
          registreringstidspunktet, slik at etterfølgende prisendringer ikke påvirker
          fakturagrunnlaget.
        </p>
      </div>
    </section>
  )
}
