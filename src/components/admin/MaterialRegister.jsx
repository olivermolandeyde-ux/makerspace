import { useMemo, useState } from "react"
import { addDocument, setDocumentActive, updateDocument } from "../../lib/firestore"
import { firebaseErrorMessage } from "../../lib/errors"
import { formatNOK } from "../../lib/cost"
import { useCollection } from "../../lib/useCollection"
import {
  EmptyState,
  ErrorNotice,
  LoadingBlock,
  PageHeader,
  Spinner,
  StatusBadge,
  SuccessNotice,
} from "../ui/Feedback"

const EMPTY_FORM = { name: "", unit: "", pricePerUnit: "" }

export default function MaterialRegister() {
  const { items, loading, error } = useCollection("materials")
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pendingId, setPendingId] = useState(null)
  const [formError, setFormError] = useState(null)
  const [listError, setListError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => String(a.name).localeCompare(String(b.name), "nb")),
    [items],
  )

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setFormError(null)
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormError(null)
  }

  function startEdit(material) {
    setEditingId(material.id)
    setForm({
      name: material.name || "",
      unit: material.unit || "",
      pricePerUnit:
        material.pricePerUnit === undefined || material.pricePerUnit === null
          ? ""
          : String(material.pricePerUnit),
    })
    setFormError(null)
    setFeedback(null)
    document.getElementById("material-form")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const name = form.name.trim()
    const unit = form.unit.trim()
    const price = Number(String(form.pricePerUnit).replace(",", "."))

    if (!name) {
      setFormError("Skriv inn navn på materialet.")
      return
    }
    if (!unit) {
      setFormError("Skriv inn enhet, for eksempel kg, plate eller stk.")
      return
    }
    if (!form.pricePerUnit || !Number.isFinite(price) || price < 0) {
      setFormError("Prisen må være et tall som er 0 eller høyere.")
      return
    }
    const duplicate = items.some(
      (material) =>
        material.id !== editingId &&
        String(material.name).trim().toLowerCase() === name.toLowerCase(),
    )
    if (duplicate) {
      setFormError("Det finnes allerede et materiale med samme navn.")
      return
    }

    setSaving(true)
    setFormError(null)
    setListError(null)

    try {
      const data = { name, unit, pricePerUnit: price }
      if (editingId) {
        await updateDocument("materials", editingId, data)
        setFeedback("Materialet er oppdatert.")
      } else {
        await addDocument("materials", { ...data, active: true })
        setFeedback("Materialet er lagt til.")
      }
      resetForm()
    } catch (saveError) {
      console.error("Kunne ikke lagre materiale:", saveError)
      setFormError(firebaseErrorMessage(saveError, "Kunne ikke lagre materialet. Prøv igjen."))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(material) {
    setPendingId(material.id)
    setListError(null)
    setFeedback(null)
    try {
      const nextActive = material.active === false
      await setDocumentActive("materials", material.id, nextActive)
      setFeedback(nextActive ? "Materialet er aktivert." : "Materialet er deaktivert.")
    } catch (toggleError) {
      console.error("Kunne ikke endre status:", toggleError)
      setListError(
        firebaseErrorMessage(toggleError, "Kunne ikke endre status på materialet."),
      )
    } finally {
      setPendingId(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Materialregister"
        title="Materialer"
        description="Navn, enhet og pris per enhet. Prisen lagres som en kopi på hver registrering, slik at historikken ikke endres når du oppdaterer prisen senere."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <section id="material-form" className="card h-fit scroll-mt-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              {editingId ? "Endre materiale" : "Nytt materiale"}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-ghost">
                Avbryt
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
            <div>
              <label htmlFor="material-name" className="field-label">
                Navn
              </label>
              <input
                id="material-name"
                className="field-input"
                type="text"
                placeholder="f.eks. PLA"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="material-unit" className="field-label">
                Enhet
              </label>
              <input
                id="material-unit"
                className="field-input"
                type="text"
                list="material-units"
                placeholder="f.eks. kg, plate, stk"
                value={form.unit}
                onChange={(event) => updateField("unit", event.target.value)}
              />
              <datalist id="material-units">
                <option value="kg" />
                <option value="g" />
                <option value="plate" />
                <option value="stk" />
                <option value="ark" />
                <option value="meter" />
              </datalist>
              <p className="field-help">
                Når enheten er «kg», kan læreren velge å skrive inn gram i skjemaet.
              </p>
            </div>

            <div>
              <label htmlFor="material-price" className="field-label">
                Pris per enhet (kr)
              </label>
              <input
                id="material-price"
                className="field-input"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.pricePerUnit}
                onChange={(event) => updateField("pricePerUnit", event.target.value)}
              />
              <p className="field-help">Bruk 0 dersom prisen ikke er fastsatt ennå.</p>
            </div>

            {formError && <ErrorNotice message={formError} />}

            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? (
                <>
                  <Spinner /> Lagrer …
                </>
              ) : editingId ? (
                "Lagre endringer"
              ) : (
                "Legg til materiale"
              )}
            </button>
          </form>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
            <h2 className="font-serif text-xl font-bold text-ink">Registrerte materialer</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {items.length} totalt
            </span>
          </div>

          <div className="space-y-4 p-5">
            {feedback && <SuccessNotice message={feedback} />}
            {listError && <ErrorNotice message={listError} />}
            {error && <ErrorNotice message={error} />}
          </div>

          {loading ? (
            <LoadingBlock label="Henter materialer …" />
          ) : sortedItems.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                title="Ingen materialer ennå"
                description="Legg til det første materialet i skjemaet, eller bruk «Fyll inn startdata» på oversikten."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Materiale</th>
                    <th scope="col">Enhet</th>
                    <th scope="col">Pris</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">
                      Handling
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((material) => {
                    const isActive = material.active !== false
                    return (
                      <tr key={material.id} className={isActive ? "" : "opacity-60"}>
                        <td className="font-semibold text-ink">{material.name}</td>
                        <td>{material.unit}</td>
                        <td className="whitespace-nowrap">{formatNOK(material.pricePerUnit)}</td>
                        <td>
                          <StatusBadge active={isActive} />
                        </td>
                        <td>
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => startEdit(material)}
                            >
                              Rediger
                            </button>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => toggleActive(material)}
                              disabled={pendingId === material.id}
                            >
                              {pendingId === material.id ? (
                                <Spinner className="h-4 w-4" />
                              ) : isActive ? (
                                "Deaktiver"
                              ) : (
                                "Aktiver"
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
