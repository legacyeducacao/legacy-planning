"use client"

import { use, useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Toaster, toast } from "sonner"
import {
  ArrowLeft,
  FileAudio,
  Download,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { getApiUrl } from "@/services/transcription"
import { getUserFriendlyErrorMessage } from "@/lib/error-utils"
import { useHistoryStore } from "@/stores/history-store"
import type {
  TranscriptionSegment,
  TranscriptionIntelligence,
} from "@/types/transcription"

type TranscribeStatus = "processing" | "completed" | "failed"

interface TranscribeResult {
  transcription: string
  segments?: TranscriptionSegment[]
  intelligence?: TranscriptionIntelligence
  detectedLanguage?: string | null
}

function getStepClassName(isDone: boolean, isActive: boolean) {
  if (isDone) return "bg-primary/10 text-primary"
  if (isActive) return "bg-primary text-primary-foreground"

  return "bg-muted text-muted-foreground"
}

export default function TranscribePage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>
}>) {
  const { id } = use(params)
  const router = useRouter()
  const [status, setStatus] = useState<TranscribeStatus>("processing")
  const [progress, setProgress] = useState(30)
  const [result, setResult] = useState<TranscribeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const attemptsRef = useRef(0)
  const patchHistory = useHistoryStore((s) => s.patch)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const poll = useCallback(async () => {
    attemptsRef.current++

    try {
      const response = await fetch(getApiUrl(`prediction/${id}`))
      if (!response.ok) throw new Error(`Server error: ${response.status}`)

      const data = await response.json()
      const audioUrl =
        data.audioUrl || localStorage.getItem("studioAudioUrl") || undefined

      if (data.audioUrl) {
        localStorage.setItem("studioAudioUrl", data.audioUrl)
      }

      if (data.status === "starting" || data.status === "processing") {
        const progressEstimate = Math.min(
          95,
          30 + Math.floor((attemptsRef.current / 40) * 65),
        )
        setProgress(progressEstimate)
      } else if (data.status === "succeeded") {
        setProgress(100)
        stopPolling()

        const output = data.output
        let transcription = ""
        let segments: TranscriptionSegment[] | undefined
        let intelligence: TranscriptionIntelligence | undefined

        if (output?.segments && Array.isArray(output.segments)) {
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

          if (output.intelligence) {
            intelligence = output.intelligence
          }
        }

        setResult({
          transcription,
          segments,
          intelligence,
          detectedLanguage: output?.detected_language,
        })
        setStatus("completed")

        // Merge result into existing history entry to preserve original options/metadata
        patchHistory(id, {
          ...(audioUrl ? { audioSource: { type: "file", url: audioUrl } } : {}),
          status: "succeeded",
          result: transcription.slice(0, 200),
        })
      } else if (data.status === "failed") {
        stopPolling()
        setStatus("failed")
        setError(data.error || "Transcription failed")
      }

      if (attemptsRef.current >= 120) {
        stopPolling()
        setStatus("failed")
        setError("Transcription timed out")
      }
    } catch (err) {
      if (attemptsRef.current >= 5) {
        stopPolling()
        const errorInfo = getUserFriendlyErrorMessage(err)
        setStatus("failed")
        setError(errorInfo.userMessage)
      }
    }
  }, [id, stopPolling, patchHistory])

  useEffect(() => {
    poll()
    pollRef.current = setInterval(poll, 5000)
    return stopPolling
  }, [poll, stopPolling])

  const handleCopy = async () => {
    if (!result?.transcription) return
    try {
      await navigator.clipboard.writeText(result.transcription)
      setCopySuccess(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleDownloadTxt = () => {
    if (!result?.transcription) return
    const blob = new Blob([result.transcription], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transcription_${id}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 100)
    toast.success("Downloaded!")
  }

  const handleRetry = () => {
    setStatus("processing")
    setError(null)
    setProgress(30)
    attemptsRef.current = 0
    poll()
    pollRef.current = setInterval(poll, 5000)
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="border-border bg-card border-b">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-muted-foreground text-sm">|</span>
          <span className="text-muted-foreground truncate text-sm">
            Transcription {id.slice(0, 8)}...
          </span>
        </div>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Processing State */}
          {status === "processing" && (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <Loader2 className="text-primary mb-6 h-12 w-12 animate-spin" />
                <h2 className="text-foreground mb-2 text-xl font-semibold">
                  Transcribing your audio...
                </h2>
                <p className="text-muted-foreground mb-8 text-sm">
                  This usually takes 1-3 minutes depending on file length
                </p>

                {/* Progress bar */}
                <div className="w-full max-w-sm">
                  <div className="text-muted-foreground mb-2 flex justify-between text-xs">
                    <span>Processing</span>
                    <span>{Math.floor(progress)}%</span>
                  </div>
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Step indicators */}
                <div className="mt-8 flex gap-3">
                  {["Uploading", "Queued", "Processing"].map((step, i) => {
                    const isActive =
                      (i === 0 && progress < 40) ||
                      (i === 1 && progress >= 40 && progress < 60) ||
                      (i === 2 && progress >= 60)
                    const isDone =
                      (i === 0 && progress >= 40) || (i === 1 && progress >= 60)
                    return (
                      <span
                        key={step}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStepClassName(isDone, isActive)}`}
                      >
                        {step}
                      </span>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed State */}
          {status === "completed" && result && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h2 className="text-foreground text-lg font-semibold">
                          Transcription Complete
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          {result.transcription.split(/\s+/).length} words
                          {result.detectedLanguage &&
                            ` · ${result.detectedLanguage}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary snippet */}
                  {result.intelligence?.summary && (
                    <div className="border-primary/20 bg-primary/5 mb-4 rounded-lg border p-4">
                      <h3 className="text-primary mb-1 text-sm font-semibold">
                        AI Summary
                      </h3>
                      <p className="text-foreground/80 text-sm leading-relaxed">
                        {result.intelligence.summary
                          .split("\n")
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((line) => line.replace(/^[-*\u2022]\s*/, ""))
                          .join(" ")}
                      </p>
                    </div>
                  )}

                  {/* Transcript preview */}
                  <div className="border-border bg-muted/50 rounded-lg border p-4">
                    <div className="text-foreground/80 max-h-64 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap">
                      {result.transcription.slice(0, 2000)}
                      {result.transcription.length > 2000 && "..."}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => router.push(`/studio/${id}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Studio
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCopy}
                  disabled={copySuccess}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copySuccess ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="lg" onClick={handleDownloadTxt}>
                  <Download className="mr-2 h-4 w-4" />
                  Download TXT
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  <FileAudio className="mr-1 inline h-4 w-4" />
                  Start a new transcription
                </Link>
              </div>
            </div>
          )}

          {/* Failed State */}
          {status === "failed" && (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <div className="bg-destructive/10 mb-6 flex h-16 w-16 items-center justify-center rounded-full">
                  <AlertCircle className="text-destructive h-8 w-8" />
                </div>
                <h2 className="text-foreground mb-2 text-xl font-semibold">
                  Transcription Failed
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md text-center text-sm">
                  {error || "Something went wrong during transcription."}
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleRetry}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Toaster />
    </div>
  )
}
