"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { TranscriptionStudio } from "@/components/transcription/TranscriptionStudio"
import { Button } from "@/components/ui/button"
import { Toaster } from "sonner"
import { ArrowLeft, FileAudio, AlertCircle, Loader2 } from "lucide-react"
import { getApiUrl } from "@/services/transcription"
import type { TranscriptionSegment, TranscriptionIntelligence, AudioSource } from "@/types/transcription"

interface StudioData {
  transcription: string
  segments?: TranscriptionSegment[]
  intelligence?: TranscriptionIntelligence
  audioSource?: AudioSource
}

function StudioSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<StudioData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
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

          const audioUrl = localStorage.getItem("studioAudioUrl") || undefined

          setData({
            transcription,
            segments,
            intelligence: output.intelligence,
            audioSource: audioUrl ? { type: "url", url: audioUrl } : undefined,
          })
        } else if (result.status === "processing" || result.status === "starting") {
          // Still processing - redirect back to transcribe page
          router.replace(`/transcribe/${id}`)
          return
        } else if (result.status === "failed") {
          setError(result.error || "Transcription failed")
        } else {
          setError("Transcription not found or not yet completed")
        }
      } catch (err) {
        console.error("Failed to load studio data:", err)
        setError("Failed to load transcription data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id, router])

  if (isLoading) return <StudioSkeleton />

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Error Loading Studio
          </h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <FileAudio className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            No Transcription Found
          </h1>
          <p className="mb-6 text-muted-foreground">
            Start a new transcription to use the studio.
          </p>
          <Button onClick={() => router.push("/")}>
            <FileAudio className="mr-2 h-4 w-4" />
            New Transcription
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Transcriptr
          </Link>
        </div>
      </div>

      <TranscriptionStudio
        transcription={data.transcription}
        audioSource={data.audioSource}
        segments={data.segments}
        intelligence={data.intelligence}
        onNewTranscription={() => router.push("/")}
      />

      <Toaster />
    </div>
  )
}
