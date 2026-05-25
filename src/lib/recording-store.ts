/**
 * Auto-save de gravação em andamento no IndexedDB.
 *
 * Estratégia: snapshot — salva o Blob acumulado a cada N segundos.
 * Sobrevive a refresh/crash da aba durante gravação.
 *
 * Schema: 1 registro singleton com chave "active".
 */

const DB_NAME = "legacy-recordings"
const STORE_NAME = "current"
const RECORD_KEY = "active"
const DB_VERSION = 1

export interface SavedRecording {
  blob: Blob
  mime: string
  durationSec: number
  savedAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB não disponível"))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveRecording(rec: SavedRecording): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).put(rec, RECORD_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn("[recording-store] save falhou:", err)
  }
}

export async function loadRecording(): Promise<SavedRecording | null> {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const req = tx.objectStore(STORE_NAME).get(RECORD_KEY)
      req.onsuccess = () =>
        resolve((req.result as SavedRecording | undefined) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export async function clearRecording(): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).delete(RECORD_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn("[recording-store] clear falhou:", err)
  }
}
