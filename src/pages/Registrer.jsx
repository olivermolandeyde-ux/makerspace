import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion as Motion } from "framer-motion"
import Navbar from "../components/Navbar"
import { ErrorNotice, LoadingBlock, Spinner } from "../components/ui/Feedback"
import { useCollection } from "../lib/useCollection"
import { addRegistration } from "../lib/firestore"
import { firebaseErrorMessage } from "../lib/errors"
import {
  calculateCost,
  formatLongDate,
  formatNOK,
  formatQuantity,
  supportsGramToggle,
  toBaseAmount,
} from "../lib/cost"

const NAME_STORAGE_KEY = "makerspace.teacherName"

function readStoredName() {
  try {
    return window.localStorage.getItem(NAME_STORAGE_KEY) || ""
  } catch {
    return ""
  }
}

function storeName(name) {
  try {
    window.localStorage.setItem(NAME_STORAGE_KEY, name)
  } catch {
    // localStorage kan være avslått (f.eks. i privat modus). Det er ikke kritisk.
  }
}

function sortByName(items) {
  return [...items].sort((a, b) => String(a.name).localeCompare(String(b.name), "nb"))
}

function capitalizeFirst(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

function parseAmount(value) {
  const parsed = Number(String(value).replace(",", "."))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

export default function Registrer() {
  const [teacherName, setTeacherName] = useState(readStoredName)
  const [departmentId, setDepartmentId] = useState("")
  const [machineId, setMachineId] = useState("")
  const [materialId, setMaterialId] = useState("")
  const [amount, setAmount] = useState("")
  const [inputUnit, setInputUnit] = useState("")
  const [approved, setApproved] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(null)

  const {
    items: departments,
    loading: loadingDepartments,
    error: departmentsError,
  } = useCollection("departments")
  const {
    items: machines,
    loading: loadingMachines,
    error: machinesError,
  } = useCollection("machines")
  const {
    items: materials,
    loading: loadingMaterials,
    error: materialsError,
  } = useCollection("materials")

  const activeDepartments = useMemo(
    () => sortByName(departments.filter((department) => department.active !== false)),
    [departments],
  )
  const activeMachines = useMemo(
    () => sortByName(machines.filter((machine) => machine.active !== false)),
    [machines],
  )

  const selectedMachine = machines.find((machine) => machine.id === machineId) || null
  const selectedMaterial = materials.find((material) => material.id === materialId) || null

  const machineMaterials = useMemo(() => {
    if (!selectedMachine) return []
    const linkedIds = new Set(selectedMachine.materialIds || [])
    return sortByName(
      materials.filter((material) => linkedIds.has(material.id) && material.active !== false),
    )
  }, [selectedMachine, materials])

  const loading = loadingDepartments || loadingMachines || loadingMaterials
  const collectionError = departmentsError || machinesError || materialsError
  const baseAmount = selectedMaterial
    ? toBaseAmount(amount, inputUnit || selectedMaterial.unit, selectedMaterial.unit)
    : Number.NaN
  const cost = selectedMaterial ? calculateCost(selectedMaterial.pricePerUnit, baseAmount) : 0
  const hasValidAmount = Number.isFinite(baseAmount) && baseAmount > 0
  const showGramToggle = Boolean(selectedMaterial && supportsGramToggle(selectedMaterial.unit))

  function handleMachineChange(event) {
    setMachineId(event.target.value)
    setMaterialId("")
    setInputUnit("")
    setAmount("")
    setErrors((current) => ({ ...current, machineId: undefined, materialId: undefined }))
  }

  function handleMaterialChange(event) {
    const nextMaterial = materials.find((material) => material.id === event.target.value)
    setMaterialId(event.target.value)
    setInputUnit(nextMaterial ? nextMaterial.unit : "")
    setAmount("")
    setErrors((current) => ({ ...current, materialId: undefined, amount: undefined }))
  }

  function handleUnitChange(nextUnit) {
    if (nextUnit === inputUnit) return

    const numericAmount = parseAmount(amount)
    if (Number.isFinite(numericAmount) && amount !== "") {
      const converted = nextUnit === "g" ? numericAmount * 1000 : numericAmount / 1000
      setAmount(String(Math.round(converted * 1000) / 1000))
    }
    setInputUnit(nextUnit)
  }

  function validate() {
    const nextErrors = {}

    if (!teacherName.trim()) {
      nextErrors.teacherName = "Skriv inn navnet ditt."
    }
    if (!departmentId) {
      nextErrors.departmentId = "Velg en avdeling."
    }
    if (!machineId) {
      nextErrors.machineId = "Velg en maskin."
    }
    if (!materialId || !selectedMaterial) {
      nextErrors.materialId = "Velg et materiale."
    } else if (!machineMaterials.some((material) => material.id === materialId)) {
      nextErrors.materialId = "Materialet hører ikke til den valgte maskinen."
    }

    const numericAmount = parseAmount(amount)
    if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      nextErrors.amount = "Mengden må være større enn 0."
    } else if (numericAmount > 1_000_000) {
      nextErrors.amount = "Mengden virker urimelig stor. Kontroller tallet."
    }

    if (!approved) {
      nextErrors.approved = "Du må bekrefte at avdelingsleder har godkjent kostnaden."
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const department = activeDepartments.find((item) => item.id === departmentId)
    const machine = activeMachines.find((item) => item.id === machineId)
    const material = materials.find((item) => item.id === materialId)

    if (!department || !machine || !material) {
      setSubmitError("Noe er endret mens du fylte ut skjemaet. Last siden på nytt og prøv igjen.")
      return
    }

    const savedAmount = toBaseAmount(amount, inputUnit || material.unit, material.unit)
    const savedCost = calculateCost(material.pricePerUnit, savedAmount)
    const cleanName = teacherName.trim()

    setSubmitting(true)
    setSubmitError(null)

    try {
      await addRegistration({
        teacherName: cleanName,
        departmentId: department.id,
        departmentName: department.name,
        machineId: machine.id,
        machineName: machine.name,
        materialId: material.id,
        materialName: material.name,
        unit: material.unit,
        amount: savedAmount,
        pricePerUnit: Number(material.pricePerUnit) || 0,
        cost: savedCost,
        approved: true,
      })

      storeName(cleanName)
      setConfirmation({
        teacherName: cleanName,
        departmentName: department.name,
        machineName: machine.name,
        materialName: material.name,
        amount: savedAmount,
        unit: material.unit,
        enteredAmount: amount,
        enteredUnit: inputUnit || material.unit,
        cost: savedCost,
        date: new Date(),
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      console.error("Kunne ikke lagre registreringen:", error)
      setSubmitError(firebaseErrorMessage(error, "Kunne ikke lagre registreringen. Prøv igjen."))
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setConfirmation(null)
    setDepartmentId("")
    setMachineId("")
    setMaterialId("")
    setAmount("")
    setInputUnit("")
    setApproved(false)
    setErrors({})
    setSubmitError(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-xl px-4 py-7 sm:py-10">
        <AnimatePresence mode="wait">
          {confirmation ? (
            <Motion.div
              key="bekreftelse"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="card overflow-hidden"
            >
              <div className="bg-success-soft px-6 py-8 text-center">
                <Motion.div
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 240, damping: 16 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success text-white shadow-sm"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="h-9 w-9"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                  </svg>
                </Motion.div>
                <h1 className="mt-4 font-serif text-2xl font-bold text-ink">
                  Takk! Registreringen er lagret.
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Kostnaden er sendt til intern fakturering.
                </p>
              </div>

              <div className="px-6 py-6">
                <dl className="divide-y divide-gray-100 text-sm">
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">Registrert av</dt>
                    <dd className="text-right font-semibold text-ink">{confirmation.teacherName}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">Dato</dt>
                    <dd className="text-right font-semibold text-ink">
                      {formatLongDate(confirmation.date)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">Avdeling</dt>
                    <dd className="text-right font-semibold text-ink">
                      {confirmation.departmentName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">Maskin</dt>
                    <dd className="text-right font-semibold text-ink">
                      {confirmation.machineName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">Materiale</dt>
                    <dd className="text-right font-semibold text-ink">
                      {confirmation.materialName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">Mengde</dt>
                    <dd className="text-right font-semibold text-ink">
                      {formatQuantity(confirmation.amount)} {confirmation.unit}
                      {confirmation.enteredUnit !== confirmation.unit && (
                        <span className="block text-xs font-normal text-muted">
                          skrevet inn som {confirmation.enteredAmount} {confirmation.enteredUnit}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="font-semibold text-ink">Kostnad</dt>
                    <dd className="text-right font-serif text-xl font-bold text-ink">
                      {formatNOK(confirmation.cost)}
                    </dd>
                  </div>
                </dl>

                <button type="button" onClick={resetForm} className="btn-primary mt-6 w-full">
                  Registrer ny
                </button>
                <Link
                  to="/"
                  className="mt-3 block text-center text-sm font-semibold text-muted hover:text-ink"
                >
                  Tilbake til forsiden
                </Link>
              </div>
            </Motion.div>
          ) : (
            <Motion.div
              key="skjema"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-5">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                  Makerspace
                </p>
                <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  Registrer forbruk
                </h1>
                <p className="mt-2 text-base leading-relaxed text-muted">
                  Fyll ut etter at du har brukt maskinen. Det tar under 30 sekunder.
                </p>
              </div>

              {collectionError && (
                <ErrorNotice
                  message={collectionError}
                  className="mb-5"
                  details="Sjekk at .env er fylt ut, at Firestore er slått på og at firestore.rules er publisert."
                />
              )}

              <div className="card p-5 sm:p-7">
                {loading ? (
                  <LoadingBlock label="Henter avdelinger, maskiner og materialer …" />
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div>
                      <label htmlFor="teacherName" className="field-label">
                        Navn
                      </label>
                      <input
                        id="teacherName"
                        name="teacherName"
                        type="text"
                        autoComplete="name"
                        maxLength={200}
                        className="field-input"
                        placeholder="Ditt navn"
                        value={teacherName}
                        onChange={(event) => {
                          setTeacherName(event.target.value)
                          setErrors((current) => ({ ...current, teacherName: undefined }))
                        }}
                        aria-invalid={Boolean(errors.teacherName)}
                        aria-describedby={errors.teacherName ? "teacherName-error" : undefined}
                      />
                      {errors.teacherName && (
                        <p id="teacherName-error" className="mt-1.5 text-sm font-medium text-danger">
                          {errors.teacherName}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="field-label">Dato</span>
                      <div className="flex min-h-12 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-base text-gray-700">
                        {capitalizeFirst(formatLongDate(new Date()))}
                      </div>
                      <p className="field-help">Datoen settes automatisk når du sender.</p>
                    </div>

                    <div>
                      <label htmlFor="departmentId" className="field-label">
                        Avdeling
                      </label>
                      <select
                        id="departmentId"
                        name="departmentId"
                        className="field-input"
                        value={departmentId}
                        onChange={(event) => {
                          setDepartmentId(event.target.value)
                          setErrors((current) => ({ ...current, departmentId: undefined }))
                        }}
                        aria-invalid={Boolean(errors.departmentId)}
                        aria-describedby={errors.departmentId ? "departmentId-error" : undefined}
                      >
                        <option value="">Velg avdeling</option>
                        {activeDepartments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                      {activeDepartments.length === 0 && (
                        <p className="field-help">
                          Ingen aktive avdelinger ennå. En administrator må legge dem inn.
                        </p>
                      )}
                      {errors.departmentId && (
                        <p id="departmentId-error" className="mt-1.5 text-sm font-medium text-danger">
                          {errors.departmentId}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="machineId" className="field-label">
                        Maskin
                      </label>
                      <select
                        id="machineId"
                        name="machineId"
                        className="field-input"
                        value={machineId}
                        onChange={handleMachineChange}
                        aria-invalid={Boolean(errors.machineId)}
                        aria-describedby={errors.machineId ? "machineId-error" : undefined}
                      >
                        <option value="">Velg maskin</option>
                        {activeMachines.map((machine) => (
                          <option key={machine.id} value={machine.id}>
                            {machine.name}
                          </option>
                        ))}
                      </select>
                      {activeMachines.length === 0 && (
                        <p className="field-help">
                          Ingen aktive maskiner ennå. En administrator må legge dem inn.
                        </p>
                      )}
                      {errors.machineId && (
                        <p id="machineId-error" className="mt-1.5 text-sm font-medium text-danger">
                          {errors.machineId}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="materialId" className="field-label">
                        Materiale
                      </label>
                      <select
                        id="materialId"
                        name="materialId"
                        className="field-input"
                        value={materialId}
                        onChange={handleMaterialChange}
                        disabled={!machineId || machineMaterials.length === 0}
                        aria-invalid={Boolean(errors.materialId)}
                        aria-describedby={errors.materialId ? "materialId-error" : undefined}
                      >
                        <option value="">
                          {!machineId
                            ? "Velg maskin først"
                            : machineMaterials.length === 0
                              ? "Ingen materialer er koblet til maskinen"
                              : "Velg materiale"}
                        </option>
                        {machineMaterials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name} ({material.unit})
                          </option>
                        ))}
                      </select>
                      {machineId && machineMaterials.length === 0 && (
                        <p className="field-help">
                          En administrator må koble materialer til denne maskinen i adminpanelet.
                        </p>
                      )}
                      {errors.materialId && (
                        <p id="materialId-error" className="mt-1.5 text-sm font-medium text-danger">
                          {errors.materialId}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="amount" className="field-label">
                        Mengde
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="amount"
                          name="amount"
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="any"
                          className="field-input flex-1"
                          placeholder="0"
                          value={amount}
                          onChange={(event) => {
                            setAmount(event.target.value)
                            setErrors((current) => ({ ...current, amount: undefined }))
                          }}
                          aria-invalid={Boolean(errors.amount)}
                          aria-describedby={errors.amount ? "amount-error" : "amount-help"}
                        />
                        <span className="flex min-w-20 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-base font-semibold text-gray-700">
                          {inputUnit || selectedMaterial?.unit || "enhet"}
                        </span>
                      </div>

                      {showGramToggle && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="inline-flex rounded-full bg-gray-100 p-1">
                            {[
                              { value: "kg", label: "kg" },
                              { value: "g", label: "gram" },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleUnitChange(option.value)}
                                aria-pressed={inputUnit === option.value}
                                className={`min-h-11 rounded-full px-4 text-sm font-semibold transition ${
                                  inputUnit === option.value
                                    ? "bg-white text-ink shadow-sm"
                                    : "text-muted hover:text-ink"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <span className="text-xs text-muted">
                            {selectedMaterial && `Pris: ${formatNOK(selectedMaterial.pricePerUnit)}/kg`}
                          </span>
                        </div>
                      )}

                      {errors.amount && (
                        <p id="amount-error" className="mt-1.5 text-sm font-medium text-danger">
                          {errors.amount}
                        </p>
                      )}
                      {!errors.amount && selectedMaterial && (
                        <p id="amount-help" className="field-help">
                          {inputUnit === "g" && hasValidAmount
                            ? `${formatQuantity(parseAmount(amount))} g = ${formatQuantity(baseAmount)} kg`
                            : `Oppgitt i ${selectedMaterial.unit}.`}
                        </p>
                      )}
                    </div>

                    <div
                      className={`rounded-2xl border px-4 py-4 transition ${
                        selectedMaterial
                          ? "border-brand-200 bg-brand-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                      aria-live="polite"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-sm font-semibold text-gray-700">
                          Beregnet kostnad
                        </span>
                        <span className="font-serif text-2xl font-bold text-ink">
                          {formatNOK(selectedMaterial ? cost : 0)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {selectedMaterial
                          ? hasValidAmount
                            ? `${formatQuantity(baseAmount)} ${selectedMaterial.unit} × ${formatNOK(selectedMaterial.pricePerUnit)} per ${selectedMaterial.unit}`
                            : `Velg mengde for å beregne kostnaden. Prisen er ${formatNOK(selectedMaterial.pricePerUnit)} per ${selectedMaterial.unit}.`
                          : "Velg materiale for å se kostnaden."}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="approved"
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                          approved
                            ? "border-brand-300 bg-brand-50"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <input
                          id="approved"
                          name="approved"
                          type="checkbox"
                          className="field-checkbox mt-0.5 shrink-0"
                          checked={approved}
                          onChange={(event) => {
                            setApproved(event.target.checked)
                            setErrors((current) => ({ ...current, approved: undefined }))
                          }}
                          aria-invalid={Boolean(errors.approved)}
                          aria-describedby={errors.approved ? "approved-error" : undefined}
                        />
                        <span className="text-sm font-medium leading-relaxed text-ink">
                          Avdelingsleder har godkjent kostnaden
                        </span>
                      </label>
                      {errors.approved && (
                        <p id="approved-error" className="mt-1.5 text-sm font-medium text-danger">
                          {errors.approved}
                        </p>
                      )}
                    </div>

                    {submitError && <ErrorNotice message={submitError} />}

                    <button
                      type="submit"
                      className="btn-primary w-full text-lg"
                      disabled={!approved || submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner /> Sender …
                        </>
                      ) : (
                        "Send registrering"
                      )}
                    </button>
                    <p className="text-center text-xs leading-relaxed text-muted">
                      Registreringen lagres med navn, avdeling, maskin, materiale og kostnad.
                    </p>
                  </form>
                )}
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
