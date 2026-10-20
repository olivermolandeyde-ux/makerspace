import {
  endOfLocalDay,
  formatDateTime,
  roundCost,
  startOfLocalDay,
  toDate,
} from "./cost"

export const EMPTY_REPORT_FILTERS = {
  from: "",
  to: "",
  departmentId: "",
  machineId: "",
  materialId: "",
  teacher: "",
}

function latestDateValue(registration) {
  return toDate(registration.date)?.getTime() || 0
}

export function filterRegistrations(registrations, filters) {
  const from = startOfLocalDay(filters.from)
  const to = endOfLocalDay(filters.to)
  const teacher = String(filters.teacher || "").trim().toLowerCase()

  return registrations.filter((registration) => {
    const date = toDate(registration.date)

    if (from && (!date || date < from)) return false
    if (to && (!date || date > to)) return false
    if (filters.departmentId && registration.departmentId !== filters.departmentId) return false
    if (filters.machineId && registration.machineId !== filters.machineId) return false
    if (filters.materialId && registration.materialId !== filters.materialId) return false
    if (teacher && !String(registration.teacherName || "").toLowerCase().includes(teacher)) {
      return false
    }
    return true
  })
}

export function sumCost(registrations) {
  return roundCost(
    registrations.reduce((sum, registration) => sum + (Number(registration.cost) || 0), 0),
  )
}

export function groupByDepartment(registrations) {
  const groups = new Map()

  for (const registration of registrations) {
    const key = registration.departmentId || registration.departmentName || "ukjent"
    const entry =
      groups.get(key) ||
      {
        id: key,
        name: registration.departmentName || "Ukjent avdeling",
        count: 0,
        cost: 0,
        latestDate: 0,
      }

    entry.count += 1
    entry.cost = roundCost(entry.cost + (Number(registration.cost) || 0))
    const timestamp = latestDateValue(registration)
    if (timestamp >= entry.latestDate) {
      entry.latestDate = timestamp
      entry.name = registration.departmentName || entry.name
    }
    groups.set(key, entry)
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.cost - a.cost || a.name.localeCompare(b.name, "nb"),
  )
}

export function groupByMaterial(registrations) {
  const groups = new Map()

  for (const registration of registrations) {
    const key = `${registration.materialId || registration.materialName || "ukjent"}|${
      registration.unit || ""
    }`
    const entry =
      groups.get(key) ||
      {
        id: key,
        name: registration.materialName || "Ukjent materiale",
        unit: registration.unit || "",
        amount: 0,
        cost: 0,
        count: 0,
        latestDate: 0,
      }

    entry.amount += Number(registration.amount) || 0
    entry.cost = roundCost(entry.cost + (Number(registration.cost) || 0))
    entry.count += 1
    const timestamp = latestDateValue(registration)
    if (timestamp >= entry.latestDate) {
      entry.latestDate = timestamp
      entry.name = registration.materialName || entry.name
    }
    groups.set(key, entry)
  }

  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name, "nb"))
}

export function groupByTeacher(registrations) {
  const groups = new Map()

  for (const registration of registrations) {
    const name = String(registration.teacherName || "Ukjent").trim() || "Ukjent"
    const key = name.toLowerCase()
    const entry = groups.get(key) || { id: key, name, count: 0, cost: 0, latestDate: 0 }

    entry.count += 1
    entry.cost = roundCost(entry.cost + (Number(registration.cost) || 0))
    const timestamp = latestDateValue(registration)
    if (timestamp >= entry.latestDate) {
      entry.latestDate = timestamp
      entry.name = name
    }
    groups.set(key, entry)
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.cost - a.cost || a.name.localeCompare(b.name, "nb"),
  )
}

export function departmentExportRows(groups) {
  return groups.map((group) => ({
    Avdeling: group.name,
    "Antall registreringer": group.count,
    "Sum (kr)": group.cost,
  }))
}

export function materialExportRows(groups) {
  return groups.map((group) => ({
    Materiale: group.name,
    Mengde: Number(group.amount.toFixed(3)),
    Enhet: group.unit,
    "Kostnad (kr)": group.cost,
  }))
}

export function teacherExportRows(groups) {
  return groups.map((group) => ({
    Lærer: group.name,
    "Antall registreringer": group.count,
    "Kostnad (kr)": group.cost,
  }))
}

export function invoiceExportRows(groups) {
  return groups.map((group) => ({
    Materiale: group.name,
    Mengde: Number(group.amount.toFixed(3)),
    Enhet: group.unit,
    "Beløp (kr)": group.cost,
  }))
}

export function registrationExportRows(registrations) {
  const sorted = [...registrations].sort(
    (a, b) => latestDateValue(b) - latestDateValue(a),
  )

  return sorted.map((registration) => ({
    Dato: formatDateTime(registration.date),
    Lærer: registration.teacherName || "",
    Avdeling: registration.departmentName || "",
    Maskin: registration.machineName || "",
    Materiale: registration.materialName || "",
    Mengde: Number(registration.amount) || 0,
    Enhet: registration.unit || "",
    "Pris per enhet (kr)": Number(registration.pricePerUnit) || 0,
    "Kostnad (kr)": Number(registration.cost) || 0,
    Godkjent: registration.approved === true ? "Ja" : "Nei",
  }))
}
