import { create } from "zustand"
import type { AudioSource, TranscriptionOptions } from "@/types/transcription"

export interface HistoryEntry {
  predictionId: string
  audioSource: AudioSource
  options: TranscriptionOptions
  status: string
  createdAt: number
  result?: string
}

interface HistoryStore {
  entries: HistoryEntry[]
  isLoaded: boolean
  load: () => Promise<void>
  add: (entry: HistoryEntry) => Promise<void>
  patch: (
    predictionId: string,
    updates: Partial<Omit<HistoryEntry, "predictionId">>,
  ) => Promise<void>
  remove: (predictionId: string) => Promise<void>
  clear: () => Promise<void>
}

const DB_NAME = "transcriptr-db"
const HISTORY_STORE_NAME = "transcription-history"
const DB_VERSION = 2

const initDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (globalThis.window === undefined || !globalThis.indexedDB) {
      reject(new Error("IndexedDB not available"))
      return
    }

    const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(new Error("Could not open IndexedDB"))

    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const tx = (event.target as IDBOpenDBRequest).transaction!

      const hadSessionsStore = db.objectStoreNames.contains(
        "transcription-sessions",
      )
      const hadHistoryStore = db.objectStoreNames.contains(HISTORY_STORE_NAME)

      if (!hadHistoryStore) {
        const store = db.createObjectStore(HISTORY_STORE_NAME, {
          keyPath: "predictionId",
        })
        store.createIndex("createdAt", "createdAt", { unique: false })
        store.createIndex("status", "status", { unique: false })
      }

      // Migrate completed sessions from the old store into the new history store
      if (hadSessionsStore && !hadHistoryStore) {
        const sessStore = tx.objectStore("transcription-sessions")
        const histStore = tx.objectStore(HISTORY_STORE_NAME)
        sessStore.getAll().onsuccess = (e) => {
          const sessions = (e.target as IDBRequest).result as Array<{
            id: string
            predictionId: string | null
            status: string
            createdAt: number
            audioSource: { type: string; url?: string; name?: string }
            options: { language: string; diarize: boolean }
            result?: string
          }>
          for (const s of sessions) {
            if (!s.predictionId) continue
            histStore.put({
              predictionId: s.predictionId,
              audioSource: {
                type: s.audioSource.type as "file" | "url",
                url: s.audioSource.url,
              },
              options: {
                language: s.options.language ?? "auto",
                diarize: s.options.diarize ?? false,
                aiFeatures: {
                  autoChapters: false,
                  summarization: false,
                  sentimentAnalysis: false,
                  entityDetection: false,
                  keyPhrases: false,
                  contentModeration: false,
                  topicDetection: false,
                },
              },
              status: s.status === "completed" ? "succeeded" : s.status,
              createdAt: s.createdAt,
              result: s.result,
            } satisfies HistoryEntry)
          }
        }
      }

      if (!hadSessionsStore) {
        const sessStore = db.createObjectStore("transcription-sessions", {
          keyPath: "id",
        })
        sessStore.createIndex("status", "status", { unique: false })
        sessStore.createIndex("expiresAt", "expiresAt", { unique: false })
        sessStore.createIndex("predictionId", "predictionId", { unique: false })
      }
    }
  })
}

const dbOperation = async <T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const db = await initDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([HISTORY_STORE_NAME], mode)
    const store = tx.objectStore(HISTORY_STORE_NAME)
    const request = fn(store)
    let result: T
    request.onsuccess = () => {
      result = request.result
    }
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(new Error("IndexedDB operation failed"))
    tx.onabort = () => reject(new Error("IndexedDB transaction aborted"))
  })
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: [],
  isLoaded: false,

  load: async () => {
    if (get().isLoaded) return
    try {
      const entries = await dbOperation<HistoryEntry[]>("readonly", (store) =>
        store.getAll(),
      )
      // Sort by createdAt descending
      entries.sort((a, b) => b.createdAt - a.createdAt)
      set({ entries, isLoaded: true })
    } catch (error) {
      console.error("Failed to load history:", error)
      set({ entries: [], isLoaded: true })
    }
  },

  add: async (entry) => {
    try {
      await dbOperation("readwrite", (store) => store.put(entry))
      set((state) => ({
        entries: [
          entry,
          ...state.entries.filter((e) => e.predictionId !== entry.predictionId),
        ],
      }))
    } catch (error) {
      console.error("Failed to add history entry:", error)
    }
  },

  patch: async (predictionId, updates) => {
    try {
      const existing = await dbOperation<HistoryEntry | undefined>(
        "readonly",
        (store) => store.get(predictionId),
      )
      if (!existing) return
      const merged = { ...existing, ...updates }
      await dbOperation("readwrite", (store) => store.put(merged))
      set((state) => ({
        entries: state.entries.map((e) =>
          e.predictionId === predictionId ? merged : e,
        ),
      }))
    } catch (error) {
      console.error("Failed to patch history entry:", error)
    }
  },

  remove: async (predictionId) => {
    try {
      await dbOperation("readwrite", (store) => store.delete(predictionId))
      set((state) => ({
        entries: state.entries.filter((e) => e.predictionId !== predictionId),
      }))
    } catch (error) {
      console.error("Failed to remove history entry:", error)
    }
  },

  clear: async () => {
    try {
      await dbOperation("readwrite", (store) => store.clear())
      set({ entries: [] })
    } catch (error) {
      console.error("Failed to clear history:", error)
    }
  },
}))
