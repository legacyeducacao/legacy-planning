"use client"

import { AlertCircle, ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Toaster } from "sonner"
import { AtaPanel } from "@/components/studio/AtaPanel"
import { Button } from "@/components/ui/button"
import { getApiUrl } from "@/services/transcription"
import type {
  TranscriptionIntelligence,
  TranscriptionSegment,
} from "@/types/transcription"

interface AtaPageData {
  transcription: string
  segments?: TranscriptionSegment[]
  intelligence?: TranscriptionIntelligence
}

export default function AtaDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>
}>) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<AtaPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      let didRedirect = false
      try {
        const response = await fetch(getApiUrl(`prediction/${id}`))
        if (!response.ok) throw new Error(`Server error: ${response.status}`)
        const result = await response.json()

        if (result.status === "succeeded" && result.output) {
          const output = result.output
          let transcription = ""
          let segments: TranscriptionSegment[] | undefined

          if (output.segments && Array.isArray(output.segments)) {
            segments = output.segments.map(
              (
                seg: {
                  start: number
                  end: number
                  text: string
                  speaker?: string
                  words?: unknown[]
                },
                idx: number,
              ) => ({
                id: idx,
                start: seg.start,
                end: seg.end,
                text: seg.text,
                speaker: seg.speaker,
                words: seg.words,
              }),
            )
            transcription = output.segments
              .map((seg: { text: string }) => seg.text)
              .join(" ")
              .trim()
          }

          setData({
            transcription,
            segments,
            intelligence: output.intelligence,
          })
        } else if (
          result.status === "processing" ||
          result.status === "starting"
        ) {
          didRedirect = true
          router.replace(`/transcribe/${id}`)
          return
        } else if (result.status === "failed") {
          setError(result.error || "Transcrição falhou")
        } else {
          setError("Transcrição não encontrada")
        }
      } catch (err) {
        console.error("Failed to load ata data:", err)
        setError("Falha ao carregar dados da ata")
      } finally {
        if (!didRedirect) setIsLoading(false)
      }
    }

    loadData()
  }, [id, router])

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <div className="bg-muted h-96 animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="bg-destructive/10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
            <AlertCircle className="text-destructive h-10 w-10" />
          </div>
          <h1 className="text-foreground mb-2 text-2xl font-bold">
            Não foi possível carregar a ata
          </h1>
          <p className="text-muted-foreground mb-6">{error ?? "Sem dados"}</p>
          <Button onClick={() => router.push("/atas")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar pra Atas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-6 lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/atas")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Atas
          </Button>
          <Link
            href={`/studio/${id}`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
          >
            <FileText className="h-4 w-4" />
            Ver transcrição
          </Link>
        </div>

        <AtaPanel
          transcriptionId={id}
          transcription={data.transcription}
          segments={data.segments}
          intelligence={data.intelligence}
        />
      </div>
      <Toaster />
    </div>
  )
}
