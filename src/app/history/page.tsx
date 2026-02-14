"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import {
  ArrowLeft,
  FileAudio,
  Trash2,
  ExternalLink,
  Search,
  Clock,
  AlertCircle,
} from "lucide-react"
import { useHistoryStore, type HistoryEntry } from "@/stores/history-store"

export default function HistoryPage() {
  const router = useRouter()
  const { entries, isLoaded, load, remove, clear } = useHistoryStore()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    load()
  }, [load])

  const filtered = entries.filter((entry) => {
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

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">History</h1>
              <p className="text-sm text-muted-foreground">
                Your past transcriptions
              </p>
            </div>
            {entries.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Clear all history?")) clear()
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          {entries.length > 0 && (
            <div className="relative mb-6">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileAudio className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-foreground">
                  {entries.length === 0 ? "No transcriptions yet" : "No results"}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  {entries.length === 0
                    ? "Start your first transcription to see it here."
                    : "Try a different search term."}
                </p>
                {entries.length === 0 && (
                  <Button onClick={() => router.push("/")}>
                    <FileAudio className="mr-2 h-4 w-4" />
                    Start Transcribing
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((entry) => (
                <Card
                  key={entry.predictionId}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => handleOpen(entry)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                        {entry.status === "succeeded" ? (
                          <FileAudio className="h-5 w-5 text-primary" />
                        ) : entry.status === "processing" ? (
                          <Clock className="h-5 w-5 text-amber-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {entry.audioSource.name || `Transcription ${entry.predictionId.slice(0, 8)}`}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(entry.createdAt)}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              entry.status === "succeeded"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : entry.status === "processing"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }`}
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
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
