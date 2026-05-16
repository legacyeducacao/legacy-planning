"use client"

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileAudio,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useCallback, useEffect, useRef, useState } from "react"
import { Toaster, toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { generateAta } from "@/lib/ata-service"
import { getUserFriendlyErrorMessage } from "@/lib/error-utils"
import { getApiUrl } from "@/services/transcription"
import { useHistoryStore } from "@/stores/history-store"
import type {
  TranscriptionIntelligence,
  TranscriptionSegment,
} from "@/types/transcription"

type TranscribeStatus = "processing" | "completed" | "failed"

interface TranscribeResult {
  transcription: string
  segments?: TranscriptionSegment[]
  intelligence?: TranscriptionIntelligence
  detectedLanguage?: string | null
}

function parseTranscriptionOutput(output: {
  segments?: unknown[]
  intelligence?: TranscriptionIntelligence
  detected_language?: string | null
}): Pick<TranscribeResult, "transcription" | "segments" | "intelligence"> {
  if (!output?.segments || !Array.isArray(output.segments)) {
    return { transcription: "", segments: undefined, intelligence: undefined }
  }

  type RawSegment = {
    start: number
    end: number
    text: string
    speaker?: string
    words?: unknown[]
  }

  const segments = output.segments.map((seg, idx) => {
    const s = seg as RawSegment
    return {
      id: idx,
      start: s.start,
      end: s.end,
      text: s.text,
      speaker: s.speaker,
      words: s.words,
    }
  }) as TranscriptionSegment[]

  const transcription = output.segments
    .map((seg) => (seg as { text: string }).text)
    .join(" ")
    .trim()

  return { transcription, segments, intelligence: output.intelligence }
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
  const { user } = useAuth()
  const [status, setStatus] = useState<TranscribeStatus>("processing")
  const [progress, setProgress] = useState(30)
  const [result, setResult] = useState<TranscribeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isGeneratingAta, setIsGeneratingAta] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const attemptsRef = useRef(0)
  const patchHistory = useHistoryStore((s) => s.patch)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const handleTranscriptionSuccess = useCallback(
    (output: unknown, audioUrl?: string) => {
      setProgress(100)
      stopPolling()
      const { transcription, segments, intelligence } =
        parseTranscriptionOutput(
          output as Parameters<typeof parseTranscriptionOutput>[0],
        )
      setResult({
        transcription,
        segments,
        intelligence,
        detectedLanguage: (output as { detected_language?: string | null })
          ?.detected_language,
      })
      setStatus("completed")
      patchHistory(id, {
        ...(audioUrl ? { audioSource: { type: "file", url: audioUrl } } : {}),
        status: "succeeded",
        result: transcription.slice(0, 200),
      })
    },
    [id, stopPolling, patchHistory],
  )

  const poll = useCallback(async () => {
    attemptsRef.current++

    try {
      const response = await fetch(getApiUrl(`prediction/${id}`))
      if (!response.ok) throw new Error(`Erro do servidor: ${response.status}`)

      const data = await response.json()
      const audioUrl =
        data.audioUrl || localStorage.getItem(`audioUrl_${id}`) || undefined

      if (data.audioUrl) {
        localStorage.setItem(`audioUrl_${id}`, data.audioUrl)
      }

      if (data.status === "starting" || data.status === "processing") {
        const progressEstimate = Math.min(
          95,
          30 + Math.floor((attemptsRef.current / 40) * 65),
        )
        setProgress(progressEstimate)
      } else if (data.status === "succeeded") {
        handleTranscriptionSuccess(data.output, audioUrl)
      } else if (data.status === "failed") {
        stopPolling()
        setStatus("failed")
        setError(data.error || "Transcrição falhou")
        patchHistory(id, { status: "failed" })
      }

      if (attemptsRef.current >= 120) {
        stopPolling()
        setStatus("failed")
        setError("Tempo limite da transcrição esgotado")
        patchHistory(id, { status: "failed" })
      }
    } catch (err) {
      if (attemptsRef.current >= 5) {
        stopPolling()
        const errorInfo = getUserFriendlyErrorMessage(err)
        setStatus("failed")
        setError(errorInfo.userMessage)
        patchHistory(id, { status: "failed" })
      }
    }
  }, [id, stopPolling, patchHistory, handleTranscriptionSuccess])

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
      toast.success("Copiado pra área de transferência!")
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      toast.error("Falha ao copiar")
    }
  }

  const handleDownloadTxt = () => {
    if (!result?.transcription) return
    const blob = new Blob([result.transcription], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transcricao_${id}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 100)
    toast.success("Download iniciado!")
  }

  const handleGerarAta = async () => {
    if (!result?.transcription) return
    setIsGeneratingAta(true)
    try {
      const gen = await generateAta({
        transcription: result.transcription,
        segments: result.segments,
        intelligence: result.intelligence,
        currentUser: user
          ? { uid: user.uid, displayName: user.displayName }
          : undefined,
      })
      try {
        localStorage.setItem(`ata_${id}`, JSON.stringify(gen.ata))
      } catch {
        // ignore quota
      }
      if (gen.source === "llm") {
        toast.success("Ata gerada com IA. Abrindo no Studio...")
      } else {
        toast.warning("Ata gerada localmente. Abrindo no Studio...", {
          description: gen.reason ? `Sem IA: ${gen.reason}` : undefined,
        })
      }
      router.push(`/studio/${id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar a ata")
      setIsGeneratingAta(false)
    }
  }

  const handleRetry = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
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
            Voltar
          </Link>
          <span className="text-muted-foreground text-sm">|</span>
          <span className="text-muted-foreground truncate text-sm">
            Transcrição {id.slice(0, 8)}...
          </span>
        </div>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Processando */}
          {status === "processing" && (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <Loader2 className="text-primary mb-6 h-12 w-12 animate-spin" />
                <h2 className="text-foreground mb-2 text-xl font-semibold">
                  Transcrevendo teu áudio...
                </h2>
                <p className="text-muted-foreground mb-8 text-sm">
                  Costuma levar de 1 a 3 minutos dependendo do tamanho do
                  arquivo
                </p>

                {/* Barra de progresso */}
                <div className="w-full max-w-sm">
                  <div className="text-muted-foreground mb-2 flex justify-between text-xs">
                    <span>Processando</span>
                    <span>{Math.floor(progress)}%</span>
                  </div>
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Etapas */}
                <div className="mt-8 flex gap-3">
                  {["Enviando", "Na fila", "Processando"].map((step, i) => {
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

          {/* Completo */}
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
                          Transcrição concluída
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          {
                            result.transcription
                              .trim()
                              .split(/\s+/)
                              .filter(Boolean).length
                          }{" "}
                          palavras
                          {result.detectedLanguage &&
                            ` · ${result.detectedLanguage}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resumo */}
                  {result.intelligence?.summary && (
                    <div className="border-primary/20 bg-primary/5 mb-4 rounded-lg border p-4">
                      <h3 className="text-primary mb-1 text-sm font-semibold">
                        Resumo gerado por IA
                      </h3>
                      <p className="text-foreground/80 text-sm leading-relaxed">
                        {result.intelligence.summary
                          .split("\n")
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((line) => line.replace(/^[-*•]\s*/, ""))
                          .join(" ")}
                      </p>
                    </div>
                  )}

                  {/* Prévia da transcrição */}
                  <div className="border-border bg-muted/50 rounded-lg border p-4">
                    <div className="text-foreground/80 max-h-64 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap">
                      {result.transcription.slice(0, 2000)}
                      {result.transcription.length > 2000 && "..."}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ações */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleGerarAta}
                  disabled={isGeneratingAta}
                >
                  {isGeneratingAta ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isGeneratingAta ? "Gerando ata..." : "Gerar ata"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push(`/studio/${id}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Studio
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCopy}
                  disabled={copySuccess}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copySuccess ? "Copiado!" : "Copiar"}
                </Button>
                <Button variant="outline" size="lg" onClick={handleDownloadTxt}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar TXT
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  <FileAudio className="mr-1 inline h-4 w-4" />
                  Nova transcrição
                </Link>
              </div>
            </div>
          )}

          {/* Falhou */}
          {status === "failed" && (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <div className="bg-destructive/10 mb-6 flex h-16 w-16 items-center justify-center rounded-full">
                  <AlertCircle className="text-destructive h-8 w-8" />
                </div>
                <h2 className="text-foreground mb-2 text-xl font-semibold">
                  Transcrição falhou
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md text-center text-sm">
                  {error || "Algo deu errado durante a transcrição."}
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleRetry}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar de novo
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Recomeçar
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
