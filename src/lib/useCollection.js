import { useEffect, useState } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"
import { firebaseErrorMessage, MISSING_CONFIG } from "./errors"

const COLLECTION_LABELS = {
  departments: "avdelinger",
  machines: "maskiner",
  materials: "materialer",
  registrations: "registreringer",
}

/**
 * Abonnerer på en Firestore-samling i sanntid.
 * Sortering gjøres i komponentene, slik at vi slipper ekstra indekser.
 */
export function useCollection(collectionName) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(db))
  const [error, setError] = useState(db ? null : MISSING_CONFIG)

  useEffect(() => {
    if (!db) return undefined

    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        setItems(snapshot.docs.map((document) => ({ id: document.id, ...document.data() })))
        setError(null)
        setLoading(false)
      },
      (snapshotError) => {
        console.error(`Feil ved henting av ${collectionName}:`, snapshotError)
        const label = COLLECTION_LABELS[collectionName] || "data"
        setError(firebaseErrorMessage(snapshotError, `Kunne ikke hente ${label}.`))
        setLoading(false)
      },
    )

    return unsubscribe
  }, [collectionName])

  return { items, loading, error }
}
