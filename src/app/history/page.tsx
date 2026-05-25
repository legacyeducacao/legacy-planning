"use client"

import {
  AlertCircle,
  Clock,
  ExternalLink,
  FileAudio,
  Search,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { type HistoryEntry, useHistoryStore } from "@/stores/history-store"

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { entries, isLoaded, load, remove, clear } = useHistoryStore()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    load()
  }, [load])

  const filtered = entries.filter((entry) => {
    // Scope por usuário: só mostra entradas do próprio usuário OU legadas
    // (sem ownerUid, criadas antes da feature de scope) pra não sumirem.
    if (user && entry.ownerUid && entry.ownerUid !== user.uid) return false
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (entry.audioSource.name?.toLowerCase().includes(term) ?? false) ||
      entry.predictionId.toLowerCase().includes(term) ||
      (entry.result?.toLowerCase().includes(term) ?? false)
    )
  })

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleOpen = (entry: HistoryEntry) => {
    if (entry.status === "succeeded") {
      router.push(`/studio/${entry.predictionId}`)
    } else {
      router.push(`/transcribe/${entry.predictionId}`)
    }
  }

  const getStatusIcon = (status: string) => {
    if (status === "succeeded") {
      return <FileAudio className="text-primary h-5 w-5" />
    }

    if (status === "processing" || status === "starting") {
      return <Clock className="h-5 w-5 text-amber-500" />
    }

    return <AlertCircle className="text-destructive h-5 w-5" />
  }

  const getStatusClassName = (status: string) => {
    if (status === "succeeded") {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    }

    if (status === "processing" || status === "starting") {
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    }

    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  }

  if (!isLoaded) {
    return (
      <div className="bg-background flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        </main>
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-bold">
                Transcrições
              </h1>
              <p className="text-muted-foreground text-sm">
                Tuas transcrições anteriores
              </p>
            </div>
            {entries.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Limpar todo o histórico?")) clear()
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar tudo
              </Button>
            )}
          </div>

          {entries.length > 0 && (
            <div className="relative mb-6">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Buscar por nome ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <FileAudio className="text-muted-foreground h-8 w-8" />
                </div>
                <h2 className="text-foreground mb-2 text-lg font-semibold">
                  {entries.length === 0
                    ? "Nenhuma transcrição ainda"
                    : "Sem resultados"}
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  {entries.length === 0
                    ? "Começa tua primeira transcrição pra ela aparecer aqui."
                    : "Tenta outro termo de busca."}
                </p>
                {entries.length === 0 && (
                  <Button onClick={() => router.push("/")}>
                    <FileAudio className="mr-2 h-4 w-4" />
                    Começar a transcrever
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((entry) => {
                const fallbackName = `Transcrição ${entry.predictionId.slice(0, 8)}`
                const ariaLabel = `Abrir transcrição: ${entry.audioSource.name || fallbackName}`
                return (
                  <Card
                    key={entry.predictionId}
                    role="button"
                    tabIndex={0}
                    aria-label={ariaLabel}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => handleOpen(entry)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleOpen(entry)
                      }
                    }}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                          {getStatusIcon(entry.status)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground truncate text-sm font-medium">
                            {entry.audioSource.name ||
                              `Transcrição ${entry.predictionId.slice(0, 8)}`}
                          </p>
                          <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            <span>{formatDate(entry.createdAt)}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClassName(entry.status)}`}
                            >
                              {entry.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            remove(entry.predictionId)
                          }}
                          className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ExternalLink className="text-muted-foreground h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
