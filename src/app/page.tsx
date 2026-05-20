"use client"

import {
  ArrowRight,
  Check,
  Clock,
  Link as LinkIcon,
  Loader2,
  Mic,
  Square,
  Upload,
  UploadCloud,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { Toaster, toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { ReleaseModal } from "@/components/ui/ReleaseModal"
import { getUserFriendlyErrorMessage } from "@/lib/error-utils"
import { getApiUrl } from "@/services/transcription"
import { useHistoryStore } from "@/stores/history-store"
import type { AIFeatures } from "@/types/transcription"

const DEFAULT_AI_FEATURES: AIFeatures = {
  autoChapters: false,
  summarization: false,
  sentimentAnalysis: false,
  entityDetection: false,
  keyPhrases: false,
  contentModeration: false,
  topicDetection: false,
}

type UploadTab = "file" | "url"

function greetingByHour(h: number): string {
  if (h >= 5 && h < 12) return "Bom dia"
  if (h >= 12 && h < 18) return "Boa tarde"
  return "Boa noite"
}

function formatLongDate(d: Date): string {
  const s = d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const addToHistory = useHistoryStore((s) => s.add)
  const historyEntries = useHistoryStore((s) => s.entries)
  const loadHistory = useHistoryStore((s) => s.load)
  const isHistoryLoaded = useHistoryStore((s) => s.isLoaded)

  const [greeting, setGreeting] = useState<string>("")
  const [longDate, setLongDate] = useState<string>("")

  useEffect(() => {
    const now = new Date()
    setGreeting(greetingByHour(now.getHours()))
    setLongDate(formatLongDate(now))
  }, [])

  useEffect(() => {
    if (!isHistoryLoaded) loadHistory()
  }, [isHistoryLoaded, loadHistory])

  // Stats
  const processingCount = historyEntries.filter(
    (e) => e.status === "processing" || e.status === "starting",
  ).length
  const thisWeekCount = (() => {
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000
    const cutoff = Date.now() - oneWeekMs
    return historyEntries.filter((e) => e.createdAt >= cutoff).length
  })()
  // Horas economizadas (heurística: 4x faster than human transcription)
  const hoursSaved = (() => {
    const totalMs = historyEntries
      .filter((e) => e.audioSource.duration)
      .reduce((acc, e) => acc + (e.audioSource.duration ?? 0), 0)
    const seconds = (totalMs * 3) / 1 // assume 3x ratio (60min audio → 3h saved)
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h === 0 && m === 0) return "0h"
    if (h === 0) return `${m}min`
    return `${h}h·${String(m).padStart(2, "0")}`
  })()

  // Upload card state
  const [activeTab, setActiveTab] = useState<UploadTab>("file")
  const [urlInput, setUrlInput] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    async (
      data: FormData | { audioUrl: string },
      options: { language: string; diarize: boolean; aiFeatures: AIFeatures },
    ) => {
      if (isSubmittingRef.current) return
      isSubmittingRef.current = true
      setIsSubmitting(true)
      try {
        let audioSourceName: string
        let audioSourceSize: number | undefined
        let audioSourceType: "file" | "url"
        let audioUrl: string | undefined
        let response: Response
        const optionsPayload = {
          language: options.language,
          diarize: options.diarize || false,
          aiFeatures: options.aiFeatures,
        }
        if (data instanceof FormData) {
          const file = data.get("file") as File
          if (!file) throw new Error("Nenhum arquivo encontrado")
          audioSourceName = file.name
          audioSourceSize = file.size
          audioSourceType = "file"
          toast.info("Enviando arquivo...")
          data.append("options", JSON.stringify(optionsPayload))
          response = await fetch(getApiUrl("transcribe"), {
            method: "POST",
            body: data,
          })
        } else {
          audioUrl = data.audioUrl
          audioSourceName = data.audioUrl
          audioSourceType = "url"
          toast.info("Iniciando transcrição...")
          response = await fetch(getApiUrl("transcribe"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioUrl: data.audioUrl,
              options: optionsPayload,
            }),
          })
        }
        if (!response.ok) {
          let errorBody = "Erro desconhecido do servidor"
          try {
            const errorJson = await response.json()
            errorBody =
              errorJson.error || errorJson.message || JSON.stringify(errorJson)
          } catch {
            errorBody = `Erro do servidor (${response.status})`
          }
          throw new Error(errorBody)
        }
        const resultData = await response.json()
        if (!resultData?.id)
          throw new Error("Resposta inválida da API: ID de predição ausente")
        if (resultData.warnings?.unsupportedFeatures?.length > 0) {
          toast.warning(
            "Alguns recursos de IA não rodam nessa língua e foram desativados. A ata será gerada localmente.",
          )
        }
        if (resultData.audioUrl) audioUrl = resultData.audioUrl
        if (audioUrl) {
          try {
            localStorage.setItem(`audioUrl_${resultData.id}`, audioUrl)
          } catch {
            // ignore
          }
        }
        addToHistory({
          predictionId: resultData.id,
          audioSource: {
            name: audioSourceName,
            size: audioSourceSize,
            type: audioSourceType,
            url: audioUrl,
          },
          options,
          status: "processing",
          createdAt: Date.now(),
        })
        router.push(`/transcribe/${resultData.id}`)
      } catch (err) {
        console.error("Upload failed:", err)
        const errorInfo = getUserFriendlyErrorMessage(err)
        toast.error(errorInfo.userMessage)
        isSubmittingRef.current = false
        setIsSubmitting(false)
      }
    },
    [router, addToHistory],
  )

  // Submit helpers ─────────────────────────────────────────
  const submitFile = useCallback(
    (file: File) => {
      const fd = new FormData()
      fd.append("file", file)
      handleUpload(fd, {
        language: "auto",
        diarize: true,
        aiFeatures: DEFAULT_AI_FEATURES,
      })
    },
    [handleUpload],
  )

  const submitUrl = useCallback(
    (url: string) => {
      try {
        const u = new URL(url)
        if (!["http:", "https:"].includes(u.protocol)) {
          toast.error("URL precisa começar com http:// ou https://")
          return
        }
      } catch {
        toast.error("URL inválida")
        return
      }
      handleUpload(
        { audioUrl: url },
        {
          language: "auto",
          diarize: true,
          aiFeatures: DEFAULT_AI_FEATURES,
        },
      )
    },
    [handleUpload],
  )

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) submitFile(f)
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) submitFile(f)
  }

  // Keyboard shortcut ⌘U / Ctrl+U to open file picker
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "u") {
        e.preventDefault()
        fileInputRef.current?.click()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const recent = historyEntries.slice(0, 3)

  return (
    <div className="min-h-full" style={{ background: "var(--r-canvas)" }}>
      {/* Hero band */}
      <section className="relative w-full px-8 pt-9 pb-14">
        {/* Greeting row */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2
              className="display-greeting"
              style={{
                fontSize: "clamp(30px, 5vw, 48px)",
                fontWeight: 700,
                color: "var(--r-ink)",
              }}
            >
              <span suppressHydrationWarning>{greeting || "Olá"}</span>,{" "}
              <span style={{ color: "var(--r-primary)" }}>
                {user?.displayName.split(" ")[0] ?? "Visitante"}
              </span>
              .
            </h2>
            <p
              className="mt-2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(18px, 2.5vw, 26px)",
                fontWeight: 500,
                letterSpacing: "-0.3px",
                color: "var(--r-stone)",
              }}
              suppressHydrationWarning
            >
              {longDate || ""}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-end gap-7">
            <Stat
              value={processingCount}
              label="processando"
              accent={processingCount > 0}
            />
            <Stat value={thisWeekCount} label="esta semana" />
            <Stat value={hoursSaved} label="economizadas" />
          </div>
        </div>

        {/* Hero H1 */}
        <h1
          className="display-hero"
          style={{
            fontSize: "clamp(34px, 7vw, 88px)",
            color: "var(--r-ink)",
            marginBottom: "20px",
          }}
        >
          <span className="block">Sua reunião começa aqui</span>
          <span className="block" style={{ color: "var(--r-primary)" }}>
            E termina por nossa conta
          </span>
        </h1>

        <p
          className="max-w-[560px]"
          style={{
            fontSize: "19px",
            lineHeight: 1.5,
            color: "var(--r-body)",
          }}
        >
          Envie uma reunião, uma entrevista ou uma nota de voz. A transcrição
          volta com falantes identificados, timestamps e um resumo executivo
          gerado por IA.
        </p>

        {/* Faint blue radial mesh decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{
            background:
              "radial-gradient(ellipse 60% 100% at 20% 100%, rgba(45,95,222,0.12), transparent 70%), radial-gradient(ellipse 60% 100% at 60% 110%, rgba(45,95,222,0.08), transparent 70%)",
          }}
        />
      </section>

      {/* Planner pitch + How it works — duas cartas dark */}
      <section className="px-8 pb-12">
        <div className="grid w-full grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
          <PlannerPitchCard onOpen={() => router.push("/planner")} />
          <HowItWorksCard />
        </div>
      </section>

      {/* Upload section — bone background */}
      <section
        className="px-8 py-12"
        style={{ background: "var(--r-surface-bone)" }}
      >
        <div className="grid w-full grid-cols-1 items-stretch gap-5 lg:grid-cols-[1fr_1.45fr]">
          {/* Left: record card (dark) — rendered AFTER upload in JSX so order on mobile is upload first */}
          <RecordCard onRecorded={submitFile} />

          {/* Right: upload card (white) */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "var(--r-surface-card)",
              border: "1px solid var(--r-hairline)",
            }}
          >
            {/* Pill tab row */}
            <div
              className="mb-5 inline-flex rounded-full p-1"
              style={{ background: "var(--r-surface-bone)" }}
            >
              {(
                [
                  { value: "file", label: "Enviar arquivo", icon: Upload },
                  { value: "url", label: "Colar URL", icon: LinkIcon },
                ] as const
              ).map((t) => {
                const active = activeTab === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setActiveTab(t.value)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors"
                    style={
                      active
                        ? {
                            background: "var(--r-surface-dark)",
                            color: "var(--r-on-dark)",
                          }
                        : { color: "var(--r-charcoal)" }
                    }
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                )
              })}
            </div>

            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div
                  className="mb-4 h-8 w-8 animate-spin rounded-full border-2"
                  style={{
                    borderColor: "var(--r-primary)",
                    borderTopColor: "transparent",
                  }}
                />
                <p className="text-sm" style={{ color: "var(--r-mute)" }}>
                  Preparando tua transcrição...
                </p>
              </div>
            ) : activeTab === "file" ? (
              <FileTabContent
                isDragging={isDragging}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPickFile={() => fileInputRef.current?.click()}
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
              />
            ) : (
              <UrlTabContent
                value={urlInput}
                onChange={setUrlInput}
                onSubmit={() => submitUrl(urlInput.trim())}
              />
            )}
          </div>
        </div>
      </section>

      {/* Recent transcriptions */}
      {recent.length > 0 && (
        <section
          className="px-8 py-12"
          style={{ background: "var(--r-surface-bone)" }}
        >
          <div className="w-full">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2
                className="display-section"
                style={{ fontSize: "32px", color: "var(--r-ink)" }}
              >
                Transcrições recentes
              </h2>
              <a
                href="/history"
                className="rounded-full px-4 py-2 text-[13px] font-medium transition-colors"
                style={{
                  border: "1px solid var(--r-hairline)",
                  color: "var(--r-ink)",
                  background: "var(--r-surface-card)",
                }}
              >
                Ver tudo →
              </a>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((e) => {
                const isProcessing =
                  e.status === "processing" || e.status === "starting"
                const date = new Date(e.createdAt)
                const dateStr = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")} · ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                const speakers = e.options.diarize ? 2 : 1
                const durationMin = e.audioSource.duration
                  ? Math.round(e.audioSource.duration / 60)
                  : null
                return (
                  <a
                    key={e.predictionId}
                    href={`/studio/${e.predictionId}`}
                    className="block rounded-[10px] p-4 transition-shadow hover:shadow-elevated"
                    style={{
                      background: "var(--r-surface-card)",
                      border: "1px solid var(--r-hairline)",
                    }}
                  >
                    <div className="mb-3">
                      {isProcessing ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            background: "rgba(45,95,222,0.08)",
                            color: "var(--r-primary)",
                          }}
                        >
                          <span
                            className="live-dot h-1.5 w-1.5 rounded-full"
                            style={{ background: "var(--r-primary)" }}
                          />
                          Processando
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{
                            background: "rgba(43,154,102,0.10)",
                            color: "var(--r-success)",
                          }}
                        >
                          Concluído
                        </span>
                      )}
                    </div>
                    <h3
                      className="mb-2 line-clamp-2"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "17px",
                        fontWeight: 600,
                        lineHeight: 1.2,
                        letterSpacing: "-0.3px",
                        color: "var(--r-ink)",
                      }}
                    >
                      {e.audioSource.name?.split("/").pop() || "Transcrição"}
                    </h3>
                    <div
                      className="mono-eyebrow flex items-center gap-2 mb-3"
                      style={{ fontSize: "11px", color: "var(--r-mute)" }}
                    >
                      <span>{dateStr}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {speakers} falante{speakers === 1 ? "" : "s"}
                      </span>
                    </div>
                    {durationMin !== null && (
                      <div
                        className="mt-3 pt-3 flex items-center gap-1.5 text-[12px]"
                        style={{
                          borderTop: "1px solid var(--r-hairline)",
                          color: "var(--r-charcoal)",
                        }}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {durationMin} min
                      </div>
                    )}
                  </a>
                )
              })}
            </div>
          </div>
        </section>
      )}

      <Toaster />
      <ReleaseModal />
    </div>
  )
}

function Stat({
  value,
  label,
  accent,
}: {
  value: number | string
  label: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col items-end leading-tight">
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "22px",
          fontWeight: 700,
          letterSpacing: "-0.5px",
          color: accent ? "var(--r-primary)" : "var(--r-ink)",
        }}
        suppressHydrationWarning
      >
        {value}
      </span>
      <span
        className="mono-eyebrow"
        style={{ fontSize: "12px", color: "var(--r-mute)" }}
      >
        {label}
      </span>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────
   Upload tab contents
   ────────────────────────────────────────────────────────────────── */

function FileTabContent({
  isDragging,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onPickFile,
  fileInputRef,
  onFileChange,
}: {
  isDragging: boolean
  onDragEnter: (e: DragEvent<HTMLDivElement>) => void
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void
  onDrop: (e: DragEvent<HTMLDivElement>) => void
  onPickFile: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <>
      {/* Dropzone */}
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onPickFile}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onPickFile()
          }
        }}
        role="button"
        tabIndex={0}
        className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl px-8 py-10 text-center transition-colors"
        style={{
          background: "var(--r-surface-dark)",
          color: "var(--r-on-dark)",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-lg"
          style={{
            inset: "8px",
            border: `1.5px dashed ${
              isDragging ? "var(--r-primary)" : "rgba(252,252,252,0.18)"
            }`,
            transition: "border-color 160ms ease",
          }}
        />

        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: "var(--r-primary)",
            boxShadow: "0 0 0 6px rgba(45,95,222,0.18)",
          }}
        >
          <UploadCloud
            className="h-6 w-6"
            style={{ color: "var(--r-on-dark)" }}
          />
        </div>

        <h3
          className="mb-3"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "-0.5px",
            lineHeight: 1.1,
          }}
        >
          {isDragging ? "Solta o arquivo aqui" : "Arraste o arquivo aqui"}
        </h3>

        <span
          className="mono-eyebrow rounded-full px-3 py-1"
          style={{
            background: "rgba(252,252,252,0.06)",
            color: "var(--r-on-dark-mute)",
            fontSize: "12px",
          }}
        >
          .mp3 · .wav · .flac · .ogg · até 100MB
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {/* Action row */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onPickFile}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors"
          style={{
            background: "var(--r-primary)",
            color: "var(--r-on-dark)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--r-primary-deep)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--r-primary)"
          }}
        >
          <Upload className="h-4 w-4" />
          Escolher arquivo
        </button>

        <a
          href="/documentation"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors"
          style={{
            background: "var(--r-surface-card)",
            border: "1px solid var(--r-hairline-strong)",
            color: "var(--r-ink)",
          }}
        >
          Ver exemplos
        </a>
      </div>
    </>
  )
}

/* ──────────────────────────────────────────────────────────────────
   RecordCard — versão expandida (substitui o how-card no grid)
   ────────────────────────────────────────────────────────────────── */

function RecordCard({ onRecorded }: { onRecorded: (file: File) => void }) {
  return (
    <div
      className="flex flex-col justify-between rounded-2xl p-7"
      style={{
        background: "var(--r-surface-dark)",
        color: "var(--r-on-dark)",
      }}
    >
      {/* Top: eyebrow + headline + subtitle */}
      <div>
        <h3
          className="mb-3"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "30px",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.6px",
            color: "var(--r-on-dark)",
          }}
        >
          Comece uma
          <br />
          gravação agora
        </h3>
        <p
          className="text-[14px]"
          style={{ color: "var(--r-on-dark-mute)", lineHeight: 1.5 }}
        >
          Clique pra capturar áudio do microfone. Para automaticamente em
          silêncios longos.
        </p>
      </div>

      {/* Middle: record control */}
      <div className="my-6 flex flex-col items-center">
        <RecordTab onRecorded={onRecorded} />
      </div>

      {/* Bottom: decorative waveform */}
      <Waveform />
    </div>
  )
}

function Waveform() {
  // Padrão de barras estáticas, alturas variadas
  const heights = [
    8, 14, 22, 12, 28, 18, 32, 24, 16, 26, 10, 30, 20, 14, 28, 22, 12, 24, 18,
    14, 26, 10, 22, 30, 16, 24, 20, 12, 18, 14, 22, 28, 12, 20, 10,
  ]
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center gap-0.5 pt-4"
      style={{ height: "32px" }}
    >
      {heights.map((h, i) => (
        <span
          key={`bar-${i}`}
          style={{
            display: "block",
            width: "2px",
            height: `${h}px`,
            background: "rgba(252,252,252,0.25)",
            borderRadius: "1px",
          }}
        />
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────
   PlannerPitchCard — pitch curto pro /planner
   ────────────────────────────────────────────────────────────────── */

function PlannerPitchCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      className="flex flex-col justify-between rounded-2xl p-8"
      style={{
        background: "var(--r-surface-dark)",
        color: "var(--r-on-dark)",
        minHeight: "320px",
      }}
    >
      <div>
        <h3
          className="mb-4"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "34px",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.7px",
            color: "var(--r-on-dark)",
          }}
        >
          A sua próxima reunião
          <br />
          <span style={{ color: "var(--r-primary)" }}>já sai planejada</span>
        </h3>
        <p
          className="max-w-md text-[14px]"
          style={{ color: "var(--r-on-dark-mute)", lineHeight: 1.55 }}
        >
          Cada transcrição vira tarefas, decisões e follow-ups com responsável e
          prazo. Nada se perde no áudio.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors"
          style={{
            background: "var(--r-primary)",
            color: "var(--r-on-dark)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--r-primary-deep)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--r-primary)"
          }}
        >
          Abrir Planner AI
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────
   HowItWorksCard — 5 passos + snippet curl
   ────────────────────────────────────────────────────────────────── */

function HowItWorksCard() {
  const steps = [
    <>
      <strong className="font-semibold">Planeje os tópicos</strong> da sua
      reunião.
    </>,
    <>
      <strong className="font-semibold">Grave ou envie</strong> seu áudio.
    </>,
    <>
      Transcrevemos seu áudio com{" "}
      <strong className="font-semibold">
        falantes, timestamps e parágrafos
      </strong>
      .
    </>,
    <>
      Geramos uma{" "}
      <strong className="font-semibold">ata completa e um resumo</strong> pra
      você enviar pra quem quiser.
    </>,
    <>
      Sai com um <strong className="font-semibold">plano de tarefas</strong>{" "}
      pronto.
    </>,
  ]
  return (
    <div
      className="flex flex-col rounded-2xl p-8"
      style={{
        background: "var(--r-surface-dark)",
        color: "var(--r-on-dark)",
      }}
    >
      <h3
        className="mb-5"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "26px",
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.5px",
          color: "var(--r-on-dark)",
        }}
      >
        Cinco passos. Sem prompts.
      </h3>
      <ol className="space-y-3 text-[14px] leading-relaxed">
        {steps.map((step, i) => (
          <li
            key={`step-${i}`}
            className="flex items-start gap-3"
            style={{ color: "var(--r-on-dark)" }}
          >
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
              style={{
                background: "rgba(252,252,252,0.08)",
                border: "1px solid rgba(252,252,252,0.10)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--r-on-dark-mute)",
              }}
            >
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function UrlTabContent({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="py-3">
      <label
        htmlFor="audio-url"
        className="mono-eyebrow mb-2 block"
        style={{ fontSize: "11px", color: "var(--r-mute)" }}
      >
        url do áudio
      </label>
      <div className="flex gap-2.5">
        <input
          id="audio-url"
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit()
          }}
          placeholder="https://exemplo.com/audio.mp3"
          className="flex-1 rounded-full px-5 py-3 text-[15px] outline-none"
          style={{
            background: "var(--r-surface-bone)",
            border: "1px solid var(--r-hairline)",
            color: "var(--r-ink)",
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim()}
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold transition-colors disabled:opacity-50"
          style={{
            background: "var(--r-primary)",
            color: "var(--r-on-dark)",
          }}
        >
          Transcrever
        </button>
      </div>
      <p className="mt-2 text-[13px]" style={{ color: "var(--r-mute)" }}>
        Suporta links diretos para .mp3, .wav, .flac, .ogg, .m4a.
      </p>
    </div>
  )
}

function RecordTab({ onRecorded }: { onRecorded: (file: File) => void }) {
  const [state, setState] = useState<
    "idle" | "requesting" | "recording" | "stopped"
  >("idle")
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordedFileRef = useRef<File | null>(null)

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pickMime = (): string => {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg",
    ]
    for (const m of candidates) {
      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported?.(m)
      ) {
        return m
      }
    }
    return "audio/webm"
  }

  const start = async () => {
    setError(null)
    setState("requesting")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = pickMime()
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      recordedFileRef.current = null
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        const blob = new Blob(chunksRef.current, { type: mime })
        const ext = mime.includes("webm")
          ? "webm"
          : mime.includes("mp4")
            ? "m4a"
            : mime.includes("ogg")
              ? "ogg"
              : "webm"
        const file = new File([blob], `gravacao-${Date.now()}.${ext}`, {
          type: mime,
        })
        recordedFileRef.current = file
        setPreviewUrl(URL.createObjectURL(blob))
      }
      recorder.start(1000) // chunks de 1s
      recorderRef.current = recorder
      startTimeRef.current = Date.now()
      setDuration(0)
      setState("recording")
      intervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 250)
    } catch (err) {
      console.error(err)
      const msg =
        err instanceof Error && err.name === "NotAllowedError"
          ? "Permissão de microfone negada. Libere nas configurações do navegador."
          : err instanceof Error
            ? err.message
            : "Não consegui acessar o microfone."
      setError(msg)
      setState("idle")
    }
  }

  const stop = () => {
    recorderRef.current?.stop()
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setState("stopped")
  }

  const discardAndRestart = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    recordedFileRef.current = null
    setDuration(0)
    setState("idle")
  }

  // Atalho de teclado: Espaço alterna idle ↔ recording. Ignora se o foco
  // estiver num input/textarea/contenteditable.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== "Space") return
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return
      }
      if (state === "idle") {
        e.preventDefault()
        start()
      } else if (state === "recording") {
        e.preventDefault()
        stop()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const submit = () => {
    if (!recordedFileRef.current) return
    onRecorded(recordedFileRef.current)
  }

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="flex flex-col items-center justify-center text-center">
      {state === "idle" && (
        <>
          <button
            type="button"
            onClick={start}
            aria-label="Começar gravação"
            className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full transition-transform hover:scale-105"
            style={{
              background: "var(--r-primary)",
              boxShadow: "0 0 0 8px rgba(45,95,222,0.18)",
            }}
          >
            <Mic className="h-7 w-7" style={{ color: "var(--r-on-dark)" }} />
          </button>
          <p
            className="mono-eyebrow"
            style={{ fontSize: "11px", color: "var(--r-on-dark-mute)" }}
          >
            aperte ou pressione{" "}
            <span
              className="rounded px-1.5 py-0.5"
              style={{
                background: "rgba(252,252,252,0.10)",
                color: "var(--r-on-dark)",
                fontWeight: 600,
              }}
            >
              espaço
            </span>
          </p>
          {error && (
            <p className="mt-2 text-[12px]" style={{ color: "#f87171" }}>
              {error}
            </p>
          )}
        </>
      )}

      {state === "requesting" && (
        <>
          <div
            className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full"
            style={{
              background: "var(--r-primary)",
              boxShadow: "0 0 0 8px rgba(45,95,222,0.18)",
            }}
          >
            <Loader2
              className="h-7 w-7 animate-spin"
              style={{ color: "var(--r-on-dark)" }}
            />
          </div>
          <p
            className="mono-eyebrow"
            style={{ fontSize: "11px", color: "var(--r-on-dark-mute)" }}
          >
            aguardando permissão do microfone...
          </p>
        </>
      )}
      {state === "recording" && (
        <>
          <div className="relative mb-5">
            <button
              type="button"
              onClick={stop}
              aria-label="Parar gravação"
              className="flex h-20 w-20 items-center justify-center rounded-full transition-colors hover:opacity-90"
              style={{ background: "#dc2626" }}
            >
              <Square
                className="h-7 w-7"
                style={{ color: "white", fill: "white" }}
              />
            </button>
            <span
              className="live-dot absolute -right-1 -top-1 h-4 w-4 rounded-full"
              style={{
                background: "#dc2626",
                boxShadow: "0 0 0 4px var(--r-surface-card)",
              }}
            />
          </div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "24px",
              fontWeight: 500,
              color: "var(--r-on-dark)",
              letterSpacing: "0.04em",
            }}
            suppressHydrationWarning
          >
            {fmt(duration)}
          </p>
          <p
            className="mono-eyebrow mt-1"
            style={{ fontSize: "11px", color: "var(--r-on-dark-mute)" }}
          >
            gravando... pressione{" "}
            <span
              className="rounded px-1.5 py-0.5"
              style={{
                background: "rgba(252,252,252,0.10)",
                color: "var(--r-on-dark)",
                fontWeight: 600,
              }}
            >
              espaço
            </span>{" "}
            pra parar
          </p>
        </>
      )}

      {state === "stopped" && (
        <>
          <div
            className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full"
            style={{
              background: "rgba(43,154,102,0.18)",
              border: "1px solid rgba(43,154,102,0.4)",
            }}
          >
            <Check className="h-7 w-7" style={{ color: "var(--r-success)" }} />
          </div>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--r-on-dark)",
            }}
          >
            Gravação pronta
          </p>
          <p
            className="mono-eyebrow mt-1"
            style={{ fontSize: "11px", color: "var(--r-on-dark-mute)" }}
          >
            {fmt(duration)} capturado
          </p>
          {previewUrl && (
            // biome-ignore lint/a11y/useMediaCaption: gravação ao vivo
            <audio src={previewUrl} controls className="mt-4 w-full max-w-xs" />
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={discardAndRestart}
              className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors"
              style={{
                background: "transparent",
                border: "1px solid rgba(252,252,252,0.20)",
                color: "var(--r-on-dark)",
              }}
            >
              Regravar
            </button>
            <button
              type="button"
              onClick={submit}
              className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors"
              style={{
                background: "var(--r-primary)",
                color: "var(--r-on-dark)",
              }}
            >
              Transcrever
            </button>
          </div>
        </>
      )}
    </div>
  )
}
