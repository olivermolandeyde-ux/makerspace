import { useMemo, useState } from "react"
import { serverTimestamp } from "firebase/firestore"
import { addDocument, setDocumentActive, updateDocument } from "../../lib/firestore"
import { firebaseErrorMessage } from "../../lib/errors"
import { formatDate } from "../../lib/cost"
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

const EMPTY_FORM = { name: "" }

export default function DepartmentRegister() {
  const { items, loading, error } = useCollection("departments")
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pendingId, setPendingId] = useState(null)
  const [formError, setFormError] = useState(null)
  const [listError, setListError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const activeDiff = Number(b.active !== false) - Number(a.active !== false)
        if (activeDiff !== 0) return activeDiff
        return String(a.name).localeCompare(String(b.name), "nb")
      }),
    [items],
  )

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormError(null)
  }

  function startEdit(department) {
    setEditingId(department.id)
    setForm({ name: department.name || "" })
    setFormError(null)
    setFeedback(null)
    document
      .getElementById("department-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const name = form.name.trim()

    if (!name) {
      setFormError("Skriv inn navn på avdelingen.")
      return
    }

    const duplicate = items.some(
      (department) =>
        department.id !== editingId &&
        String(department.name).trim().toLowerCase() === name.toLowerCase(),
    )
    if (duplicate) {
      setFormError("Det finnes allerede en avdeling med samme navn.")
      return
    }

    setSaving(true)
    setFormError(null)
    setListError(null)

    try {
      if (editingId) {
        await updateDocument("departments", editingId, { name })
        setFeedback("Avdelingen er oppdatert.")
      } else {
        await addDocument("departments", {
          name,
          active: true,
          createdAt: serverTimestamp(),
        })
        setFeedback("Avdelingen er lagt til.")
      }
      resetForm()
    } catch (saveError) {
      console.error("Kunne ikke lagre avdeling:", saveError)
      setFormError(firebaseErrorMessage(saveError, "Kunne ikke lagre avdelingen. Prøv igjen."))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(department) {
    setPendingId(department.id)
    setListError(null)
    setFeedback(null)
    try {
      const nextActive = department.active === false
      await setDocumentActive("departments", department.id, nextActive)
      setFeedback(nextActive ? "Avdelingen er aktivert." : "Avdelingen er deaktivert.")
    } catch (toggleError) {
      console.error("Kunne ikke endre status:", toggleError)
      setListError(
        firebaseErrorMessage(toggleError, "Kunne ikke endre status på avdelingen."),
      )
    } finally {
      setPendingId(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Avdelingsregister"
        title="Avdelinger"
        description="Deaktiverte avdelinger skjules i registreringsskjemaet, men alle gamle registreringer og rapporter beholdes."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <section id="department-form" className="card h-fit scroll-mt-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-serif text-xl font-bold text-ink">
              {editingId ? "Endre avdeling" : "Ny avdeling"}
            </h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-ghost">
                Avbryt
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
            <div>
              <label htmlFor="department-name" className="field-label">
                Navn
              </label>
              <input
                id="department-name"
                className="field-input"
                type="text"
                placeholder="f.eks. Studiespesialisering"
                value={form.name}
                onChange={(event) => {
                  setForm({ name: event.target.value })
                  setFormError(null)
                }}
              />
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
                "Legg til avdeling"
              )}
            </button>
          </form>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
            <h2 className="font-serif text-xl font-bold text-ink">Registrerte avdelinger</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {items.filter((department) => department.active !== false).length} aktive
            </span>
          </div>

          <div className="space-y-4 p-5">
            {feedback && <SuccessNotice message={feedback} />}
            {listError && <ErrorNotice message={listError} />}
            {error && <ErrorNotice message={error} />}
          </div>

          {loading ? (
            <LoadingBlock label="Henter avdelinger …" />
          ) : sortedItems.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                title="Ingen avdelinger ennå"
                description="Legg til den første avdelingen i skjemaet, eller bruk «Fyll inn startdata» på oversikten."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Avdeling</th>
                    <th scope="col">Opprettet</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">
                      Handling
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((department) => {
                    const isActive = department.active !== false
                    return (
                      <tr key={department.id} className={isActive ? "" : "opacity-60"}>
                        <td className="min-w-56 font-semibold text-ink">{department.name}</td>
                        <td className="whitespace-nowrap">{formatDate(department.createdAt)}</td>
                        <td>
                          <StatusBadge active={isActive} />
                        </td>
                        <td>
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => startEdit(department)}
                            >
                              Rediger
                            </button>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => toggleActive(department)}
                              disabled={pendingId === department.id}
                            >
                              {pendingId === department.id ? (
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
