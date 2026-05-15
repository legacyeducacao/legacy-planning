"use client"

import { CheckCircle2, ListTodo, Sparkles, Trash2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { useTodosStore } from "@/stores/todos-store"

type Filter = "todas" | "abertas" | "concluidas"

export default function TarefasPage() {
  const todos = useTodosStore((s) => s.todos)
  const isLoaded = useTodosStore((s) => s.isLoaded)
  const load = useTodosStore((s) => s.load)
  const toggle = useTodosStore((s) => s.toggle)
  const clearCompleted = useTodosStore((s) => s.clearCompleted)
  const [filter, setFilter] = useState<Filter>("abertas")

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (filter === "abertas") return todos.filter((t) => !t.completed)
    if (filter === "concluidas") return todos.filter((t) => t.completed)
    return todos
  }, [todos, filter])

  const counts = useMemo(
    () => ({
      todas: todos.length,
      abertas: todos.filter((t) => !t.completed).length,
      concluidas: todos.filter((t) => t.completed).length,
    }),
    [todos],
  )

  // Group by ata for visual separation
  const grouped = useMemo(() => {
    const byAta = new Map<
      string,
      { titulo: string; geradaEm: string; items: typeof filtered }
    >()
    for (const todo of filtered) {
      const entry = byAta.get(todo.ataId)
      if (entry) {
        entry.items.push(todo)
      } else {
        byAta.set(todo.ataId, {
          titulo: todo.ataTitulo,
          geradaEm: todo.ataGeradaEm,
          items: [todo],
        })
      }
    }
    return Array.from(byAta.entries())
  }, [filtered])

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-foreground text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Tarefas
            </h1>
            <p className="text-muted-foreground mt-2 text-base">
              Encaminhamentos das suas atas, num só lugar.
            </p>
          </div>

          {counts.concluidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompleted}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpar concluídas ({counts.concluidas})
            </Button>
          )}
        </header>

        {/* Filters */}
        <div className="border-border mb-8 flex items-center gap-1 border-b">
          {(
            [
              { value: "abertas", label: "Abertas", count: counts.abertas },
              { value: "todas", label: "Todas", count: counts.todas },
              {
                value: "concluidas",
                label: "Concluídas",
                count: counts.concluidas,
              },
            ] as const
          ).map((f) => {
            const isActive = filter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`relative -mb-px px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground border-foreground border-b-2"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                }`}
              >
                {f.label}
                <span
                  className={`ml-2 text-xs tabular-nums ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {f.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Empty state */}
        {isLoaded && todos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-muted mb-6 flex h-16 w-16 items-center justify-center rounded-full">
              <ListTodo className="text-muted-foreground h-8 w-8" />
            </div>
            <h2 className="text-foreground mb-2 text-xl font-semibold tracking-tight">
              Sem tarefas por aqui
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm text-sm">
              Tarefas surgem automaticamente quando você gera uma ata de
              reunião. Cada encaminhamento vira um item.
            </p>
            <Button asChild className="gap-2">
              <Link href="/">
                <Sparkles className="h-4 w-4" />
                Nova transcrição
              </Link>
            </Button>
          </div>
        )}

        {/* Empty filter state */}
        {isLoaded && todos.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="text-muted-foreground mb-4 h-10 w-10" />
            <p className="text-muted-foreground text-sm">
              {filter === "abertas"
                ? "Tudo limpo. Nenhuma tarefa em aberto."
                : filter === "concluidas"
                  ? "Nenhuma tarefa concluída ainda."
                  : "Nada por aqui."}
            </p>
          </div>
        )}

        {/* Grouped list */}
        <div className="space-y-10">
          {grouped.map(([ataId, group]) => (
            <section key={ataId}>
              <header className="mb-3 flex items-baseline justify-between gap-4">
                <h2 className="text-foreground text-sm font-semibold tracking-tight">
                  {group.titulo}
                </h2>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {new Date(group.geradaEm).toLocaleDateString("pt-BR")}
                </span>
              </header>
              <ul className="space-y-2">
                {group.items.map((todo) => (
                  <li
                    key={todo.id}
                    className={`border-border bg-card flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                      todo.completed ? "opacity-60" : ""
                    }`}
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={todo.completed}
                      onClick={() => toggle(todo.id)}
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-colors ${
                        todo.completed
                          ? "bg-foreground border-foreground"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {todo.completed && (
                        <CheckCircle2 className="text-background h-3.5 w-3.5" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-foreground text-sm leading-relaxed ${
                          todo.completed ? "line-through" : ""
                        }`}
                      >
                        {todo.acao}
                      </p>
                      {(todo.responsavel || todo.prazo) && (
                        <div className="text-muted-foreground mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                          {todo.responsavel && (
                            <span>
                              <span className="font-medium">Responsável:</span>{" "}
                              {todo.responsavel}
                            </span>
                          )}
                          {todo.prazo && (
                            <span>
                              <span className="font-medium">Prazo:</span>{" "}
                              {todo.prazo}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/studio/${todo.ataId}`}
                      className="text-muted-foreground hover:text-foreground text-xs whitespace-nowrap underline-offset-4 hover:underline"
                    >
                      Abrir ata
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <Toaster />
    </div>
  )
}
