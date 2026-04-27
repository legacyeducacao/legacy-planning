"use client"

import { AlertCircle, ArrowLeft, FileAudio } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Toaster } from "sonner"
import { TranscriptionStudio } from "@/components/transcription/TranscriptionStudio"
import { Button } from "@/components/ui/button"
import { getApiUrl } from "@/services/transcription"
import type {
  AudioSource,
  TranscriptionIntelligence,
  TranscriptionSegment,
} from "@/types/transcription"

interface StudioData {
  transcription: string
  segments?: TranscriptionSegment[]
  intelligence?: TranscriptionIntelligence
  audioSource?: AudioSource
}

function StudioSkeleton() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <div className="bg-muted h-8 w-48 animate-pulse rounded" />
            <div className="bg-muted h-4 w-64 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-10 w-32 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-muted h-96 animate-pulse rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="bg-muted h-48 animate-pulse rounded-xl" />
            <div className="bg-muted h-32 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudioPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>
}>) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<StudioData | null>(null)
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

          const audioUrl =
            result.audioUrl ||
            localStorage.getItem(`audioUrl_${id}`) ||
            undefined

          if (result.audioUrl) {
            localStorage.setItem(`audioUrl_${id}`, result.audioUrl)
          }

          setData({
            transcription,
            segments,
            intelligence: output.intelligence,
            audioSource: audioUrl ? { type: "url", url: audioUrl } : undefined,
          })
        } else if (
          result.status === "processing" ||
          result.status === "starting"
        ) {
          didRedirect = true
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
        if (!didRedirect) setIsLoading(false)
      }
    }

    loadData()
  }, [id, router])

  if (isLoading) return <StudioSkeleton />

  if (error) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="bg-destructive/10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
            <AlertCircle className="text-destructive h-10 w-10" />
          </div>
          <h1 className="text-foreground mb-2 text-2xl font-bold">
            Error Loading Studio
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
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
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="bg-muted mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
            <FileAudio className="text-muted-foreground h-10 w-10" />
          </div>
          <h1 className="text-foreground mb-2 text-2xl font-bold">
            No Transcription Found
          </h1>
          <p className="text-muted-foreground mb-6">
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
    <div className="bg-background min-h-screen">
      {/* Top bar */}
      <div className="border-border bg-card border-b">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
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
