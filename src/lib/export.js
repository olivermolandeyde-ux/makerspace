import { toIsoDateInput } from "./cost"

async function loadXlsx() {
  const module = await import("xlsx")
  return module.default ?? module
}

function worksheetFromRows(XLSX, rows) {
  const safeRows = rows.length > 0 ? rows : [{ Info: "Ingen data i dette utvalget" }]
  const worksheet = XLSX.utils.json_to_sheet(safeRows)
  const headers = Object.keys(safeRows[0])
  worksheet["!cols"] = headers.map((header) => ({
    wch: Math.max(14, Math.min(42, header.length + 10)),
  }))
  return worksheet
}

/** Eksporterer ett eller flere ark til én .xlsx-fil. */
export async function exportWorkbook({ fileName, sheets }) {
  const XLSX = await loadXlsx()
  const workbook = XLSX.utils.book_new()
  const usedNames = new Set()

  for (const sheet of sheets) {
    let name = String(sheet.name || "Ark").slice(0, 31)
    let suffix = 2
    while (usedNames.has(name)) {
      name = `${String(sheet.name).slice(0, 28)} ${suffix}`
      suffix += 1
    }
    usedNames.add(name)
    XLSX.utils.book_append_sheet(workbook, worksheetFromRows(XLSX, sheet.rows || []), name)
  }

  XLSX.writeFile(workbook, fileName)
}

export function reportFileName(prefix = "makerspace-forbruk") {
  return `${prefix}-${toIsoDateInput()}.xlsx`
}
