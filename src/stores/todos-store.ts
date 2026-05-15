import { create } from "zustand"
import type { Ata, AtaPlanoAcao, AtaStatus } from "@/types/transcription"

export interface Todo {
  id: string
  ataId: string
  ataTitulo: string
  ataGeradaEm: string
  index: number
  acao: string
  responsavel?: string
  prazo?: string
  status?: AtaStatus
  completed: boolean
}

interface TodosStore {
  todos: Todo[]
  isLoaded: boolean
  load: () => void
  toggle: (id: string) => void
  clearCompleted: () => void
  removeByAtaId: (ataId: string) => void
}

const COMPLETED_KEY = "todos_completed_v1"
const ATA_PREFIX = "ata_"

function readCompletedMap(): Record<string, boolean> {
  if (typeof localStorage === "undefined") return {}
  try {
    const raw = localStorage.getItem(COMPLETED_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, boolean>
  } catch {
    return {}
  }
}

function writeCompletedMap(map: Record<string, boolean>) {
  if (typeof localStorage === "undefined") return
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(map))
  } catch {
    // quota / private mode — ignore
  }
}

function todoId(ataId: string, index: number) {
  return `${ataId}__enc_${index}`
}

function buildTodos(): Todo[] {
  if (typeof localStorage === "undefined") return []
  const completed = readCompletedMap()
  const todos: Todo[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith(ATA_PREFIX)) continue
    const ataId = key.slice(ATA_PREFIX.length)
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const ata = JSON.parse(raw) as Ata
      const items = Array.isArray(ata.planoAcao) ? ata.planoAcao : []
      if (items.length === 0) continue

      items.forEach((item: AtaPlanoAcao, idx: number) => {
        if (!item?.descricao) return
        const id = todoId(ataId, idx)
        const isDoneByStatus = item.status === "Concluído"
        todos.push({
          id,
          ataId,
          ataTitulo: ata.titulo ?? "Ata de Reunião",
          ataGeradaEm: ata.geradaEm,
          index: idx,
          acao: item.descricao,
          responsavel: item.responsavel,
          prazo: item.prazo,
          status: item.status,
          completed: completed[id] ?? isDoneByStatus,
        })
      })
    } catch {
      // Corrupted ata entry — skip
    }
  }

  // Newest atas first; within an ata, preserve original order
  todos.sort((a, b) => {
    const ataCmp =
      new Date(b.ataGeradaEm).getTime() - new Date(a.ataGeradaEm).getTime()
    if (ataCmp !== 0) return ataCmp
    return a.index - b.index
  })

  return todos
}

export const useTodosStore = create<TodosStore>((set, get) => ({
  todos: [],
  isLoaded: false,

  load: () => {
    set({ todos: buildTodos(), isLoaded: true })
  },

  toggle: (id) => {
    const map = readCompletedMap()
    const next = !map[id]
    if (next) map[id] = true
    else delete map[id]
    writeCompletedMap(map)
    set({
      todos: get().todos.map((t) =>
        t.id === id ? { ...t, completed: next } : t,
      ),
    })
  },

  clearCompleted: () => {
    const map = readCompletedMap()
    for (const key of Object.keys(map)) delete map[key]
    writeCompletedMap(map)
    set({
      todos: get().todos.map((t) => ({ ...t, completed: false })),
    })
  },

  removeByAtaId: (ataId) => {
    // Used when an ata is regenerated — drop its todos from view and clean completion state
    const map = readCompletedMap()
    for (const key of Object.keys(map)) {
      if (key.startsWith(`${ataId}__enc_`)) delete map[key]
    }
    writeCompletedMap(map)
    set({ todos: get().todos.filter((t) => t.ataId !== ataId) })
  },
}))
