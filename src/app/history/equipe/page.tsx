"use client"

import {
  AlertCircle,
  ArrowLeft,
  Clock,
  ExternalLink,
  FileAudio,
  Search,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  listTeamTranscriptions,
  type RemoteTranscription,
} from "@/lib/transcriptions-sync"

export default function HistoryEquipePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [items, setItems] = useState<RemoteTranscription[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Bloqueia acesso a não-masters
  useEffect(() => {
    if (isLoading) return
    if (!user || user.role !== "master") {
      router.replace("/history")
    }
  }, [user, isLoading, router])

  // Carrega lista da equipe (exceto eu mesmo)
  useEffect(() => {
    if (!user || user.role !== "master") return
    let active = true
    setIsLoadingItems(true)
    listTeamTranscriptions(user.uid)
      .then((data) => {
        if (active) setItems(data)
      })
      .finally(() => {
        if (active) setIsLoadingItems(false)
      })
    return () => {
      active = false
    }
  }, [user])

  if (isLoading || !user || user.role !== "master") {
    return null
  }

  const filtered = items.filter((entry) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (entry.audio_name?.toLowerCase().includes(term) ?? false) ||
      entry.prediction_id.toLowerCase().includes(term) ||
      (entry.owner_display_name?.toLowerCase().includes(term) ?? false) ||
      (entry.owner_email?.toLowerCase().includes(term) ?? false)
    )
  })

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    if (status === "succeeded")
      return <FileAudio className="text-primary h-5 w-5" />
    if (status === "processing" || status === "starting")
      return <Clock className="h-5 w-5 text-amber-500" />
    return <AlertCircle className="text-destructive h-5 w-5" />
  }

  const getStatusClassName = (status: string) => {
    if (status === "succeeded")
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    if (status === "processing" || status === "starting")
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  }

  const handleOpen = (entry: RemoteTranscription) => {
    if (entry.status === "succeeded") {
      router.push(`/studio/${entry.prediction_id}`)
    } else {
      router.push(`/transcribe/${entry.prediction_id}`)
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm">
            <Users className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground">Visão de master</span>
          </div>
          <h1 className="text-foreground text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Transcrições da equipe
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Tudo que os outros usuários da Legacy transcreveram.
          </p>
        </header>

        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/history")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Minhas transcrições
          </Button>
          {items.length > 0 && (
            <span className="text-muted-foreground text-sm">
              {items.length} {items.length === 1 ? "registro" : "registros"}
            </span>
          )}
        </div>

        {items.length > 0 && (
          <div className="relative mb-6">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Buscar por nome, usuário ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {isLoadingItems ? (
          <div className="flex items-center justify-center py-16">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Users className="text-muted-foreground h-8 w-8" />
              </div>
              <h2 className="text-foreground mb-2 text-lg font-semibold">
                {items.length === 0
                  ? "Nenhuma transcrição da equipe ainda"
                  : "Sem resultados"}
              </h2>
              <p className="text-muted-foreground mb-2 max-w-sm text-sm">
                {items.length === 0
                  ? "Quando outros usuários da Legacy criarem transcrições, elas aparecem aqui."
                  : "Tenta outro termo de busca."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => (
              <Card
                key={entry.prediction_id}
                role="button"
                tabIndex={0}
                aria-label={`Abrir transcrição: ${entry.audio_name ?? entry.prediction_id}`}
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
                        {entry.audio_name ||
                          `Transcrição ${entry.prediction_id.slice(0, 8)}`}
                      </p>
                      <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="font-medium">
                          {entry.owner_display_name ??
                            entry.owner_email ??
                            entry.owner_uid.slice(0, 8)}
                        </span>
                        <span>·</span>
                        <span>{formatDate(entry.created_at)}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClassName(entry.status)}`}
                        >
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
