import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { MISSING_CONFIG } from "./errors"

function requireDb() {
  if (!db) throw new Error(MISSING_CONFIG)
  return db
}

export async function addDocument(collectionName, data) {
  return addDoc(collection(requireDb(), collectionName), data)
}

export async function updateDocument(collectionName, id, data) {
  return updateDoc(doc(requireDb(), collectionName, id), data)
}

export async function setDocumentActive(collectionName, id, active) {
  return updateDocument(collectionName, id, { active })
}

export async function addRegistration(data) {
  return addDocument("registrations", {
    ...data,
    date: serverTimestamp(),
  })
}
