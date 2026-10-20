import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore"
import { db } from "../firebase"
import { MISSING_CONFIG } from "./errors"

const DEFAULT_DEPARTMENTS = [
  "Bygg- og anleggsteknikk",
  "Informasjonsteknologi og medieproduksjon",
  "Frisør blomst interiør og eksponeringsdesign",
  "Kombinasjonsklasse",
  "Kunst design og arkitektur",
  "Medier og kommunikasjon",
  "Restaurant- og matfag",
  "Studiespesialisering",
]

// Nøklene brukes bare internt for å koble maskiner til riktige materialer.
const DEFAULT_MATERIALS = [
  { key: "pla", name: "PLA", unit: "kg", pricePerUnit: 300 },
  { key: "petg", name: "PETG", unit: "kg", pricePerUnit: 350 },
  { key: "tpu", name: "TPU", unit: "kg", pricePerUnit: 0 },
  { key: "kryssfiner3", name: "Kryssfinerplate 3 mm", unit: "plate", pricePerUnit: 65 },
  { key: "kryssfiner6", name: "Kryssfinerplate 6 mm", unit: "plate", pricePerUnit: 0 },
  { key: "mdf", name: "MDF", unit: "plate", pricePerUnit: 0 },
  { key: "akryl", name: "Akrylplate", unit: "plate", pricePerUnit: 0 },
  { key: "kopp", name: "Sublimeringskopp", unit: "stk", pricePerUnit: 18 },
  { key: "transferark", name: "Transferark", unit: "ark", pricePerUnit: 0 },
  { key: "sublimeringspapir", name: "Sublimeringspapir", unit: "ark", pricePerUnit: 0 },
  { key: "tskjorte", name: "T-skjorte", unit: "stk", pricePerUnit: 0 },
  { key: "vinylfolie", name: "Vinylfolie", unit: "meter", pricePerUnit: 0 },
]

const DEFAULT_MACHINES = [
  { name: "3D-printer", materialKeys: ["pla", "petg", "tpu"] },
  { name: "Laserkutter", materialKeys: ["kryssfiner3", "kryssfiner6", "mdf", "akryl"] },
  { name: "Koppresse", materialKeys: ["kopp"] },
  { name: "Tekstilpresse", materialKeys: ["transferark", "sublimeringspapir", "tskjorte"] },
  { name: "Vinylkutter", materialKeys: ["vinylfolie"] },
  { name: "Sublimeringsprinter", materialKeys: ["sublimeringspapir", "transferark"] },
  { name: "Annet", materialKeys: ["*"] },
]

function normalizeName(name) {
  return String(name || "").trim().toLowerCase()
}

/**
 * Fyller bare samlinger som er helt tomme. Alt skrives i én batch, slik at
 * en avbrutt operasjon ikke etterlater halvferdige samlinger.
 * Maskiner kobles til materialer via navn, slik at dette også fungerer
 * dersom materialene allerede fantes fra før.
 */
export async function seedStartData() {
  if (!db) throw new Error(MISSING_CONFIG)

  const [departmentsSnapshot, materialsSnapshot, machinesSnapshot] = await Promise.all([
    getDocs(collection(db, "departments")),
    getDocs(collection(db, "materials")),
    getDocs(collection(db, "machines")),
  ])

  const result = { departments: 0, materials: 0, machines: 0 }
  const materialIdByKey = new Map()
  const batch = writeBatch(db)
  let operations = 0

  if (departmentsSnapshot.empty) {
    for (const name of DEFAULT_DEPARTMENTS) {
      const reference = doc(collection(db, "departments"))
      batch.set(reference, {
        name,
        active: true,
        createdAt: serverTimestamp(),
      })
      result.departments += 1
      operations += 1
    }
  }

  if (materialsSnapshot.empty) {
    for (const material of DEFAULT_MATERIALS) {
      const reference = doc(collection(db, "materials"))
      batch.set(reference, {
        name: material.name,
        unit: material.unit,
        pricePerUnit: material.pricePerUnit,
        active: true,
      })
      materialIdByKey.set(material.key, reference.id)
      result.materials += 1
      operations += 1
    }
  } else {
    const existingByName = new Map(
      materialsSnapshot.docs.map((document) => [normalizeName(document.data().name), document.id]),
    )
    for (const material of DEFAULT_MATERIALS) {
      const existingId = existingByName.get(normalizeName(material.name))
      if (existingId) materialIdByKey.set(material.key, existingId)
    }
  }

  if (machinesSnapshot.empty) {
    const allMaterialIds = Array.from(materialIdByKey.values())

    for (const machine of DEFAULT_MACHINES) {
      const materialIds =
        machine.materialKeys[0] === "*"
          ? allMaterialIds
          : machine.materialKeys.map((key) => materialIdByKey.get(key)).filter(Boolean)

      batch.set(doc(collection(db, "machines")), {
        name: machine.name,
        materialIds,
        active: true,
      })
      result.machines += 1
      operations += 1
    }
  }

  if (operations > 0) {
    await batch.commit()
  }

  return result
}

export { DEFAULT_DEPARTMENTS, DEFAULT_MACHINES, DEFAULT_MATERIALS }
