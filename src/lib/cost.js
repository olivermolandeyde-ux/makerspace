const nokFormatter = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const quantityFormatter = new Intl.NumberFormat("nb-NO", {
  maximumFractionDigits: 3,
})

const dateTimeFormatter = new Intl.DateTimeFormat("nb-NO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const dateFormatter = new Intl.DateTimeFormat("nb-NO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

const longDateFormatter = new Intl.DateTimeFormat("nb-NO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

/** Legger på to desimaler uten å dra med flyttallsstøy. */
export function roundCost(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

export function formatNOK(value) {
  return nokFormatter.format(Number(value) || 0)
}

export function formatQuantity(value) {
  return quantityFormatter.format(Number(value) || 0)
}

export function formatDateTime(value) {
  const date = toDate(value)
  return date ? dateTimeFormatter.format(date) : "–"
}

export function formatDate(value) {
  const date = toDate(value)
  return date ? dateFormatter.format(date) : "–"
}

export function formatLongDate(value = new Date()) {
  return longDateFormatter.format(toDate(value) || new Date())
}

/**
 * Gjør om det brukeren har skrevet til materialets grunnenhet.
 * Foreløpig støtter vi gram -> kg, som er det som er praktisk for filament.
 */
export function toBaseAmount(value, inputUnit, baseUnit) {
  const amount = Number(String(value).replace(",", "."))
  if (!Number.isFinite(amount)) return Number.NaN
  const normalizedBase = String(baseUnit || "").trim().toLowerCase()
  const normalizedInput = String(inputUnit || "").trim().toLowerCase()
  if (normalizedBase === "kg" && normalizedInput === "g") return amount / 1000
  return amount
}

/** Kostnad = mengde i grunnenhet * pris per enhet. */
export function calculateCost(pricePerUnit, baseAmount) {
  return roundCost((Number(pricePerUnit) || 0) * (Number(baseAmount) || 0))
}

export function supportsGramToggle(unit) {
  return String(unit || "").trim().toLowerCase() === "kg"
}

/** Tåler Firestore Timestamp, Date, tall og ISO-strenger. */
export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === "function") return value.toDate()
  if (typeof value === "number") return new Date(value)
  if (typeof value === "string") {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

/** Lokal start/slutt på dagen for dato-input (YYYY-MM-DD). */
export function startOfLocalDay(isoDate) {
  if (!isoDate) return null
  const date = new Date(`${isoDate}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function endOfLocalDay(isoDate) {
  if (!isoDate) return null
  const date = new Date(`${isoDate}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function toIsoDateInput(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
