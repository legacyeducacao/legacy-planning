"use client"

import {
  Clock,
  Command,
  Link as LinkIcon,
  Mic,
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
import { ReleaseModal } from "@/components/ui/ReleaseModal"
import { getUserFriendlyErrorMessage } from "@/lib/error-utils"
import { CURRENT_USER } from "@/lib/user"
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

type UploadTab = "file" | "url" | "record"

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
      <section className="relative mx-auto max-w-[1200px] px-8 pt-9 pb-14">
        {/* Greeting row */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2
              className="display-greeting"
              style={{ fontSize: "32px", color: "var(--r-ink)" }}
            >
              <span suppressHydrationWarning>{greeting || "Olá"}</span>,{" "}
              <span style={{ color: "var(--r-primary)" }}>
                {CURRENT_USER.nome.split(" ")[0]}
              </span>
              .
            </h2>
            <p
              className="mt-1"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
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
            fontSize: "clamp(40px, 8vw, 88px)",
            color: "var(--r-ink)",
            marginBottom: "20px",
          }}
        >
          <span className="block whitespace-nowrap">
            Sua reunião começa aqui
          </span>
          <span
            className="block whitespace-nowrap"
            style={{ color: "var(--r-primary)" }}
          >
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

      {/* Upload section — bone background */}
      <section
        className="px-8 py-12"
        style={{ background: "var(--r-surface-bone)" }}
      >
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
          {/* Left: upload card */}
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
                  { value: "record", label: "Gravar agora", icon: Mic },
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
            ) : activeTab === "url" ? (
              <UrlTabContent
                value={urlInput}
                onChange={setUrlInput}
                onSubmit={() => submitUrl(urlInput.trim())}
              />
            ) : (
              <RecordTabPlaceholder />
            )}
          </div>

          {/* Right: how-card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "var(--r-surface-dark)",
              color: "var(--r-on-dark)",
            }}
          >
            <p
              className="mono-eyebrow mb-2"
              style={{
                fontSize: "11px",
                color: "var(--r-on-dark-mute)",
              }}
            >
              # como funciona
            </p>
            <h3
              className="mb-5"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: "-0.5px",
              }}
            >
              Três passos. Sem prompts.
            </h3>
            <ol className="mb-6 space-y-3 text-[14px] leading-relaxed">
              {[
                {
                  text: (
                    <>
                      Envie o áudio.{" "}
                      <strong className="font-semibold">
                        Reconhecemos português, inglês e espanhol
                      </strong>{" "}
                      automaticamente.
                    </>
                  ),
                },
                {
                  text: (
                    <>
                      O modelo identifica falantes, separa em parágrafos e gera{" "}
                      <strong className="font-semibold">
                        timestamps por linha
                      </strong>
                      .
                    </>
                  ),
                },
                {
                  text: (
                    <>
                      Receba a transcrição com{" "}
                      <strong className="font-semibold">
                        resumo, tópicos e ações
                      </strong>{" "}
                      extraídas.
                    </>
                  ),
                },
              ].map((step, i) => (
                <li
                  key={`step-${i}`}
                  className="flex gap-3"
                  style={{ color: "var(--r-on-dark)" }}
                >
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: "rgba(252,252,252,0.10)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--r-on-dark-mute)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span>{step.text}</span>
                </li>
              ))}
            </ol>

            <pre
              className="overflow-x-auto rounded-lg p-3"
              style={{
                background: "var(--r-surface-deep)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                lineHeight: 1.65,
                color: "var(--r-on-dark)",
              }}
            >
              <code>
                <span style={{ color: "var(--r-on-dark-mute)" }}>
                  # via API
                </span>
                {"\n"}
                <span style={{ color: "#7dd3fc" }}>curl</span> -X POST{"\n"}
                https://api.legacyplanning.app/v1 \{"\n"}
                {"  "}-F file=
                <span style={{ color: "#fde68a" }}>"@reuniao.mp3"</span> \{"\n"}
                {"  "}-F summary=
                <span style={{ color: "#fde68a" }}>"true"</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Recent transcriptions */}
      {recent.length > 0 && (
        <section
          className="px-8 py-12"
          style={{ background: "var(--r-surface-bone)" }}
        >
          <div className="mx-auto max-w-[1200px]">
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
      {/* Dark dropzone */}
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
        className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl px-12 py-12 text-center transition-colors"
        style={{
          background: "var(--r-surface-dark)",
          color: "var(--r-on-dark)",
        }}
      >
        {/* Inner dashed border */}
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

        {/* Blue circular icon with soft glow */}
        <div
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-full"
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
            fontSize: "28px",
            fontWeight: 600,
            letterSpacing: "-0.6px",
            lineHeight: 1.1,
          }}
        >
          {isDragging
            ? "Solta o arquivo aqui"
            : "Arraste o arquivo de áudio aqui"}
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
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onPickFile}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors"
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
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors"
          style={{
            background: "var(--r-surface-card)",
            border: "1px solid var(--r-hairline-strong)",
            color: "var(--r-ink)",
          }}
        >
          Ver exemplos
        </a>

        <div className="ml-auto flex items-center gap-1.5">
          <Kbd>
            <Command className="h-3 w-3" />
          </Kbd>
          <Kbd>U</Kbd>
          <span
            className="mono-eyebrow"
            style={{ fontSize: "12px", color: "var(--r-mute)" }}
          >
            para abrir o seletor
          </span>
        </div>
      </div>
    </>
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

function RecordTabPlaceholder() {
  return (
    <div
      className="flex flex-col items-center justify-center py-14 text-center"
      style={{ color: "var(--r-charcoal)" }}
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          background: "var(--r-surface-bone)",
          border: "1px solid var(--r-hairline)",
        }}
      >
        <Mic className="h-5 w-5" />
      </div>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--r-ink)",
        }}
      >
        Em breve
      </p>
      <p className="mt-1 text-[13px]" style={{ color: "var(--r-mute)" }}>
        Gravação direto do navegador chega no próximo release.
      </p>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex h-5 min-w-[20px] items-center justify-center rounded px-1.5 text-[11px] font-medium"
      style={{
        background: "var(--r-surface-bone)",
        border: "1px solid var(--r-hairline)",
        color: "var(--r-charcoal)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {children}
    </span>
  )
}
