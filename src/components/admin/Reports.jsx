import { useMemo, useState } from "react"
import { useCollection } from "../../lib/useCollection"
import { exportWorkbook, reportFileName } from "../../lib/export"
import { formatNOK, formatQuantity } from "../../lib/cost"
import {
  EMPTY_REPORT_FILTERS,
  departmentExportRows,
  filterRegistrations,
  groupByDepartment,
  groupByMaterial,
  groupByTeacher,
  invoiceExportRows,
  materialExportRows,
  registrationExportRows,
  sumCost,
  teacherExportRows,
} from "../../lib/reports"
import { ErrorNotice, EmptyState, LoadingBlock, PageHeader, Spinner } from "../ui/Feedback"
import InvoicePreview from "./InvoicePreview"

const VIEWS = [
  { id: "department", label: "Per avdeling" },
  { id: "material", label: "Per materiale" },
  { id: "teacher", label: "Per lærer" },
  { id: "invoice", label: "Fakturagrunnlag" },
]

const EXPORT_PREFIX = {
  department: "makerspace-forbruk-avdelinger",
  material: "makerspace-forbruk-materialer",
  teacher: "makerspace-forbruk-laerere",
  invoice: "makerspace-fakturagrunnlag",
  all: "makerspace-forbruk",
}

function ExportButton({ onClick, busy, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="btn-secondary shrink-0"
    >
      {busy ? (
        <>
          <Spinner className="h-4 w-4" /> Eksporterer …
        </>
      ) : (
        "Eksporter til Excel"
      )}
    </button>
  )
}

export default function Reports() {
  const departmentsState = useCollection("departments")
  const machinesState = useCollection("machines")
  const materialsState = useCollection("materials")
  const registrationsState = useCollection("registrations")

  const [filters, setFilters] = useState(EMPTY_REPORT_FILTERS)
  const [activeView, setActiveView] = useState("department")
  const [exporting, setExporting] = useState(null)
  const [exportError, setExportError] = useState(null)

  const departments = useMemo(
    () =>
      [...departmentsState.items].sort((a, b) =>
        String(a.name).localeCompare(String(b.name), "nb"),
      ),
    [departmentsState.items],
  )
  const machines = useMemo(
    () =>
      [...machinesState.items].sort((a, b) =>
        String(a.name).localeCompare(String(b.name), "nb"),
      ),
    [machinesState.items],
  )
  const materials = useMemo(
    () =>
      [...materialsState.items].sort((a, b) =>
        String(a.name).localeCompare(String(b.name), "nb"),
      ),
    [materialsState.items],
  )

  const filtered = useMemo(
    () => filterRegistrations(registrationsState.items, filters),
    [registrationsState.items, filters],
  )
  const departmentGroups = useMemo(() => groupByDepartment(filtered), [filtered])
  const materialGroups = useMemo(() => groupByMaterial(filtered), [filtered])
  const teacherGroups = useMemo(() => groupByTeacher(filtered), [filtered])
  const total = sumCost(filtered)

  const invoiceFilters = useMemo(
    () => ({
      ...EMPTY_REPORT_FILTERS,
      from: filters.from,
      to: filters.to,
      departmentId: filters.departmentId,
    }),
    [filters.from, filters.to, filters.departmentId],
  )
  const invoiceRegistrations = useMemo(
    () => filterRegistrations(registrationsState.items, invoiceFilters),
    [registrationsState.items, invoiceFilters],
  )
  const invoiceGroups = useMemo(() => groupByMaterial(invoiceRegistrations), [invoiceRegistrations])
  const invoiceTotal = sumCost(invoiceRegistrations)
  const selectedDepartment =
    departments.find((department) => department.id === filters.departmentId) || null

  const loading =
    departmentsState.loading ||
    machinesState.loading ||
    materialsState.loading ||
    registrationsState.loading
  const collectionError =
    departmentsState.error || machinesState.error || materialsState.error || registrationsState.error

  const summaryTotal = activeView === "invoice" ? invoiceTotal : total
  const summaryCount =
    activeView === "invoice" ? invoiceRegistrations.length : filtered.length
  const summaryDepartmentCount =
    activeView === "invoice" ? (selectedDepartment ? 1 : 0) : departmentGroups.length

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
    setExportError(null)
  }

  function buildSheet(view) {
    if (view === "department") {
      const rows = departmentExportRows(departmentGroups)
      rows.push({
        Avdeling: "Totalt",
        "Antall registreringer": filtered.length,
        "Sum (kr)": total,
      })
      return { name: "Per avdeling", rows }
    }

    if (view === "material") {
      const rows = materialExportRows(materialGroups)
      rows.push({ Materiale: "Totalt", Mengde: "", Enhet: "", "Kostnad (kr)": total })
      return { name: "Per materiale", rows }
    }

    if (view === "teacher") {
      const rows = teacherExportRows(teacherGroups)
      rows.push({
        Lærer: "Totalt",
        "Antall registreringer": filtered.length,
        "Kostnad (kr)": total,
      })
      return { name: "Per lærer", rows }
    }

    const rows = invoiceExportRows(invoiceGroups)
    rows.push({ Materiale: "Sum å fakturere", Mengde: "", Enhet: "", "Beløp (kr)": invoiceTotal })
    return { name: "Fakturagrunnlag", rows }
  }

  async function handleExport(view) {
    if (view === "invoice" && !filters.departmentId) {
      setExportError("Velg avdeling før du eksporterer fakturagrunnlaget.")
      return
    }

    setExporting(view)
    setExportError(null)
    try {
      if (view === "all") {
        const sheets = [
          buildSheet("department"),
          buildSheet("material"),
          buildSheet("teacher"),
          { name: "Registreringer", rows: registrationExportRows(filtered) },
        ]
        if (filters.departmentId) {
          sheets.push(buildSheet("invoice"))
        }
        await exportWorkbook({ fileName: reportFileName(EXPORT_PREFIX.all), sheets })
      } else {
        await exportWorkbook({
          fileName: reportFileName(EXPORT_PREFIX[view]),
          sheets: [buildSheet(view)],
        })
      }
    } catch (error) {
      console.error("Kunne ikke eksportere til Excel:", error)
      setExportError("Kunne ikke lage Excel-filen. Prøv igjen.")
    } finally {
      setExporting(null)
    }
  }

  function handlePrint() {
    if (!filters.departmentId || invoiceGroups.length === 0) return
    window.print()
  }

  return (
    <>
      <div className="no-print">
        <PageHeader
          eyebrow="Rapporter"
          title="Forbruk og fakturagrunnlag"
          description="Filtrer på periode, avdeling, maskin, materiale eller lærer. Alle summer hentes fra de lagrede registreringene."
        >
          <button
            type="button"
            onClick={() => handleExport("all")}
            disabled={loading || Boolean(exporting)}
            className="btn-secondary"
          >
            {exporting === "all" ? (
              <>
                <Spinner className="h-4 w-4" /> Eksporterer …
              </>
            ) : (
              "Eksporter alle visninger"
            )}
          </button>
        </PageHeader>
      </div>

      {collectionError && <ErrorNotice message={collectionError} className="mb-6 no-print" />}
      {exportError && <ErrorNotice message={exportError} className="mb-6 no-print" />}

      <div
        role="tablist"
        aria-label="Rapportvisninger"
        className="no-print flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1.5"
      >
        {VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={activeView === view.id}
            onClick={() => {
              setActiveView(view.id)
              setExportError(null)
            }}
            className={`min-h-10 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeView === view.id
                ? "bg-brand-500 text-ink shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-ink"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      <section className="card no-print mt-4 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="report-from" className="field-label">
              Dato fra
            </label>
            <input
              id="report-from"
              type="date"
              className="field-input"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(event) => updateFilter("from", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="report-to" className="field-label">
              Dato til
            </label>
            <input
              id="report-to"
              type="date"
              className="field-input"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) => updateFilter("to", event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="report-department" className="field-label">
              Avdeling
            </label>
            <select
              id="report-department"
              className="field-input"
              value={filters.departmentId}
              onChange={(event) => updateFilter("departmentId", event.target.value)}
            >
              <option value="">Alle avdelinger</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                  {department.active === false ? " (inaktiv)" : ""}
                </option>
              ))}
            </select>
          </div>

          {activeView !== "invoice" && (
            <>
              <div>
                <label htmlFor="report-machine" className="field-label">
                  Maskin
                </label>
                <select
                  id="report-machine"
                  className="field-input"
                  value={filters.machineId}
                  onChange={(event) => updateFilter("machineId", event.target.value)}
                >
                  <option value="">Alle maskiner</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                      {machine.active === false ? " (inaktiv)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="report-material" className="field-label">
                  Materiale
                </label>
                <select
                  id="report-material"
                  className="field-input"
                  value={filters.materialId}
                  onChange={(event) => updateFilter("materialId", event.target.value)}
                >
                  <option value="">Alle materialer</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                      {material.active === false ? " (inaktiv)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="report-teacher" className="field-label">
                  Lærer
                </label>
                <input
                  id="report-teacher"
                  type="search"
                  className="field-input"
                  placeholder="Søk etter navn"
                  value={filters.teacher}
                  onChange={(event) => updateFilter("teacher", event.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">
            {activeView === "invoice"
              ? "Fakturagrunnlaget bruker bare periode og avdeling."
              : `Viser ${filtered.length} registreringer i utvalget.`}
          </p>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setFilters(EMPTY_REPORT_FILTERS)
              setExportError(null)
            }}
          >
            Nullstill filtre
          </button>
        </div>
      </section>

      <div className="no-print mt-4 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Totalsum</p>
          <p className="mt-1 font-serif text-2xl font-bold text-ink">{formatNOK(summaryTotal)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Registreringer</p>
          <p className="mt-1 font-serif text-2xl font-bold text-ink">{summaryCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {activeView === "invoice" ? "Avdeling valgt" : "Avdelinger i utvalget"}
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-ink">{summaryDepartmentCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="card mt-6">
          <LoadingBlock label="Henter registreringer …" />
        </div>
      ) : activeView === "department" ? (
        <section className="card mt-6 overflow-hidden">
          <header className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-ink">Forbruk per avdeling</h2>
              <p className="mt-1 text-sm text-muted">Totalt beløp for hver avdeling i utvalget.</p>
            </div>
            <ExportButton
              onClick={() => handleExport("department")}
              busy={exporting === "department"}
              disabled={Boolean(exporting)}
            />
          </header>
          {departmentGroups.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Ingen data i utvalget"
                description="Juster filtrene eller registrer nytt forbruk."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Avdeling</th>
                    <th scope="col" className="text-right">
                      Registreringer
                    </th>
                    <th scope="col" className="text-right">
                      Sum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {departmentGroups.map((group) => (
                    <tr key={group.id}>
                      <td className="font-semibold text-ink">{group.name}</td>
                      <td className="text-right tabular-nums">{group.count}</td>
                      <td className="text-right font-semibold tabular-nums text-ink">
                        {formatNOK(group.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold text-ink">
                    <td className="px-4 py-3">Totalt</td>
                    <td className="px-4 py-3 text-right tabular-nums">{filtered.length}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatNOK(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      ) : activeView === "material" ? (
        <section className="card mt-6 overflow-hidden">
          <header className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-ink">Forbruk per materiale</h2>
              <p className="mt-1 text-sm text-muted">Mengde og kostnad for hvert materiale.</p>
            </div>
            <ExportButton
              onClick={() => handleExport("material")}
              busy={exporting === "material"}
              disabled={Boolean(exporting)}
            />
          </header>
          {materialGroups.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Ingen data i utvalget"
                description="Juster filtrene eller registrer nytt forbruk."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Materiale</th>
                    <th scope="col" className="text-right">
                      Mengde
                    </th>
                    <th scope="col" className="text-right">
                      Kostnad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {materialGroups.map((group) => (
                    <tr key={group.id}>
                      <td className="font-semibold text-ink">{group.name}</td>
                      <td className="text-right tabular-nums">
                        {formatQuantity(group.amount)} {group.unit}
                      </td>
                      <td className="text-right font-semibold tabular-nums text-ink">
                        {formatNOK(group.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold text-ink">
                    <td className="px-4 py-3">Totalt</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-right tabular-nums">{formatNOK(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      ) : activeView === "teacher" ? (
        <section className="card mt-6 overflow-hidden">
          <header className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-ink">Forbruk per lærer</h2>
              <p className="mt-1 text-sm text-muted">Kostnad for hver lærer i utvalget.</p>
            </div>
            <ExportButton
              onClick={() => handleExport("teacher")}
              busy={exporting === "teacher"}
              disabled={Boolean(exporting)}
            />
          </header>
          {teacherGroups.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Ingen data i utvalget"
                description="Juster filtrene eller registrer nytt forbruk."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Lærer</th>
                    <th scope="col" className="text-right">
                      Registreringer
                    </th>
                    <th scope="col" className="text-right">
                      Kostnad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teacherGroups.map((group) => (
                    <tr key={group.id}>
                      <td className="font-semibold text-ink">{group.name}</td>
                      <td className="text-right tabular-nums">{group.count}</td>
                      <td className="text-right font-semibold tabular-nums text-ink">
                        {formatNOK(group.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold text-ink">
                    <td className="px-4 py-3">Totalt</td>
                    <td className="px-4 py-3 text-right tabular-nums">{filtered.length}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatNOK(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      ) : (
        <>
          <div className="no-print mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={handlePrint}
              disabled={!filters.departmentId || invoiceGroups.length === 0}
            >
              Skriv ut / lagre som PDF
            </button>
            <ExportButton
              onClick={() => handleExport("invoice")}
              busy={exporting === "invoice"}
              disabled={Boolean(exporting) || !filters.departmentId}
            />
            <p className="text-xs text-muted">
              Velg «Lagre som PDF» i utskriftsdialogen for å lage PDF.
            </p>
          </div>

          <InvoicePreview
            department={selectedDepartment}
            groups={invoiceGroups}
            registrationCount={invoiceRegistrations.length}
            filters={filters}
            total={invoiceTotal}
          />
        </>
      )}
    </>
  )
}
