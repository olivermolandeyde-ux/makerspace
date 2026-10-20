import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { addDocument, setDocumentActive, updateDocument } from "../../lib/firestore"
import { firebaseErrorMessage } from "../../lib/errors"
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

const EMPTY_FORM = { name: "", materialIds: [] }

export default function MachineRegister() {
  const machinesState = useCollection("machines")
  const materialsState = useCollection("materials")
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pendingId, setPendingId] = useState(null)
  const [formError, setFormError] = useState(null)
  const [listError, setListError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const materials = useMemo(
    () =>
      [...materialsState.items].sort((a, b) =>
        String(a.name).localeCompare(String(b.name), "nb"),
      ),
    [materialsState.items],
  )
  const sortedMachines = useMemo(
    () =>
      [...machinesState.items].sort((a, b) =>
        String(a.name).localeCompare(String(b.name), "nb"),
      ),
    [machinesState.items],
  )
  const materialsById = useMemo(
    () => new Map(materialsState.items.map((material) => [material.id, material])),
    [materialsState.items],
  )

  const loading = machinesState.loading || materialsState.loading
  const collectionError = machinesState.error || materialsState.error
  const isEditing = Boolean(editingId)

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormError(null)
  }

  function startEdit(machine) {
    setEditingId(machine.id)
    setForm({
      name: machine.name || "",
      materialIds: Array.isArray(machine.materialIds) ? machine.materialIds : [],
    })
    setFormError(null)
    setFeedback(null)
    document.getElementById("machine-form")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function toggleMaterial(materialId) {
    setForm((current) => ({
      ...current,
      materialIds: current.materialIds.includes(materialId)
        ? current.materialIds.filter((id) => id !== materialId)
        : [...current.materialIds, materialId],
    }))
    setFormError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) {
      setFormError("Skriv inn navn på maskinen.")
      return
    }

    const duplicate = machinesState.items.some(
      (machine) =>
        machine.id !== editingId &&
        String(machine.name).trim().toLowerCase() === name.toLowerCase(),
    )
    if (duplicate) {
      setFormError("Det finnes allerede en maskin med samme navn.")
      return
    }

    const materialIds = form.materialIds.filter((id) => materialsById.has(id))

    setSaving(true)
    setFormError(null)
    setListError(null)

    try {
      if (editingId) {
        await updateDocument("machines", editingId, { name, materialIds })
        setFeedback("Maskinen er oppdatert.")
      } else {
        await addDocument("machines", { name, materialIds, active: true })
        setFeedback("Maskinen er lagt til.")
      }
      resetForm()
    } catch (saveError) {
      console.error("Kunne ikke lagre maskin:", saveError)
      setFormError(firebaseErrorMessage(saveError, "Kunne ikke lagre maskinen. Prøv igjen."))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(machine) {
    setPendingId(machine.id)
    setListError(null)
    setFeedback(null)
    try {
      const nextActive = machine.active === false
      await setDocumentActive("machines", machine.id, nextActive)
      setFeedback(nextActive ? "Maskinen er aktivert." : "Maskinen er deaktivert.")
    } catch (toggleError) {
      console.error("Kunne ikke endre status:", toggleError)
      setListError(firebaseErrorMessage(toggleError, "Kunne ikke endre status på maskinen."))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Maskinregister"
        title="Maskiner"
        description="Koble hver maskin til materialene som kan brukes på den. Bare aktive maskiner vises i registreringsskjemaet."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section id="machine-form" className="card h-fit scroll-mt-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              {isEditing ? "Endre maskin" : "Ny maskin"}
            </h2>
            {isEditing && (
              <button type="button" onClick={resetForm} className="btn-ghost">
                Avbryt
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
            <div>
              <label htmlFor="machine-name" className="field-label">
                Navn
              </label>
              <input
                id="machine-name"
                className="field-input"
                type="text"
                placeholder="f.eks. 3D-printer"
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }))
                  setFormError(null)
                }}
              />
            </div>

            <fieldset>
              <legend className="field-label">Materialer som kan brukes</legend>
              {materials.length === 0 ? (
                <p className="rounded-xl bg-gray-50 p-3 text-sm text-muted">
                  Det finnes ingen materialer ennå.{" "}
                  <Link to="/admin/materialer" className="font-semibold text-ink underline">
                    Legg til materialer først.
                  </Link>
                </p>
              ) : (
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-gray-200 p-2">
                  {materials.map((material) => (
                    <label
                      key={material.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        className="field-checkbox"
                        checked={form.materialIds.includes(material.id)}
                        onChange={() => toggleMaterial(material.id)}
                      />
                      <span className="flex-1">
                        {material.name}{" "}
                        <span className="text-muted">({material.unit})</span>
                        {material.active === false && (
                          <span className="ml-2 text-xs font-semibold text-gray-400">inaktiv</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <p className="field-help">
                {form.materialIds.length} materialer valgt. Maskinen kan lagres uten materialer,
                men da får læreren ingen valg i skjemaet.
              </p>
            </fieldset>

            {formError && <ErrorNotice message={formError} />}

            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? (
                <>
                  <Spinner /> Lagrer …
                </>
              ) : isEditing ? (
                "Lagre endringer"
              ) : (
                "Legg til maskin"
              )}
            </button>
          </form>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
            <h2 className="font-serif text-xl font-bold text-ink">Registrerte maskiner</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {machinesState.items.filter((machine) => machine.active !== false).length} aktive
            </span>
          </div>

          <div className="space-y-4 p-5">
            {feedback && <SuccessNotice message={feedback} />}
            {listError && <ErrorNotice message={listError} />}
            {collectionError && <ErrorNotice message={collectionError} />}
          </div>

          {loading ? (
            <LoadingBlock label="Henter maskiner …" />
          ) : sortedMachines.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                title="Ingen maskiner ennå"
                description="Legg til den første maskinen i skjemaet, eller bruk «Fyll inn startdata» på oversikten."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Maskin</th>
                    <th scope="col">Materialer</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">
                      Handling
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMachines.map((machine) => {
                    const isActive = machine.active !== false
                    const linkedMaterials = (machine.materialIds || [])
                      .map((id) => materialsById.get(id))
                      .filter(Boolean)
                    return (
                      <tr key={machine.id} className={isActive ? "" : "opacity-60"}>
                        <td className="whitespace-nowrap font-semibold text-ink">{machine.name}</td>
                        <td>
                          {linkedMaterials.length === 0 ? (
                            <span className="text-sm text-gray-400">Ingen materialer</span>
                          ) : (
                            <div className="flex max-w-md flex-wrap gap-1.5">
                              {linkedMaterials.map((material) => (
                                <span
                                  key={material.id}
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                    material.active === false
                                      ? "bg-gray-100 text-gray-400"
                                      : "bg-brand-50 text-brand-800"
                                  }`}
                                >
                                  {material.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <StatusBadge active={isActive} />
                        </td>
                        <td>
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => startEdit(machine)}
                            >
                              Rediger
                            </button>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => toggleActive(machine)}
                              disabled={pendingId === machine.id}
                            >
                              {pendingId === machine.id ? (
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
