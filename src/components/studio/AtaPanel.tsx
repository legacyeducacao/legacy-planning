"use client"

import {
  AlertTriangle,
  AlignJustify,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react"
import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { buildAtaDocx } from "@/lib/ata-docx"
import { ataToMarkdown, normalizeAta } from "@/lib/ata-format"
import { generateAta as generateAtaService } from "@/lib/ata-service"
import { canDelete, canEdit } from "@/lib/permissions"
import type {
  Ata,
  AtaParticipante,
  AtaPlanoAcao,
  AtaStatus,
  TranscriptionIntelligence,
  TranscriptionSegment,
} from "@/types/transcription"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { EmailComposeModal } from "./EmailComposeModal"

interface AtaPanelProps {
  transcriptionId?: string
  transcription: string
  segments?: TranscriptionSegment[]
  intelligence?: TranscriptionIntelligence
}

function cacheKey(id?: string) {
  return id ? `ata_${id}` : null
}

function loadCachedAta(id?: string): Ata | null {
  const key = cacheKey(id)
  if (!key) return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return normalizeAta(JSON.parse(raw))
  } catch {
    return null
  }
}

function saveCachedAta(id: string | undefined, ata: Ata) {
  const key = cacheKey(id)
  if (!key) return
  try {
    localStorage.setItem(key, JSON.stringify(ata))
  } catch {
    // ignore
  }
}

function clearCachedAta(id?: string) {
  const key = cacheKey(id)
  if (!key) return
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/* ────────────────────────────────────────────────────────────────
   Inline editable primitives
   ──────────────────────────────────────────────────────────────── */

const EDITABLE_INPUT =
  "bg-transparent w-full rounded px-1 -mx-1 outline-none hover:bg-muted/60 focus:bg-muted transition-colors"

interface EditableTextProps {
  value: string | undefined
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
  rows?: number
}

function EditableText({
  value,
  onChange,
  placeholder,
  className = "",
  multiline = false,
  rows = 2,
}: EditableTextProps) {
  const props = {
    value: value ?? "",
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    placeholder,
    className: `${EDITABLE_INPUT} ${className}`,
  }
  if (multiline) {
    return (
      <textarea
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        rows={rows}
        className={`${props.className} resize-none leading-relaxed`}
      />
    )
  }
  return (
    <input
      type="text"
      {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
    />
  )
}

interface FieldRowProps {
  label: string
  children: ReactNode
}
function FieldRow({ label, children }: FieldRowProps) {
  return (
    <div className="grid grid-cols-1 gap-1 py-1.5 sm:grid-cols-[180px_1fr] sm:gap-3">
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider sm:pt-1">
        {label}
      </span>
      <div className="text-foreground text-sm">{children}</div>
    </div>
  )
}

interface SectionHeaderProps {
  number: string
  title: string
}
function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <h3 className="text-foreground mb-3 flex items-baseline gap-2 text-base font-semibold tracking-tight">
      <span className="text-muted-foreground tabular-nums">{number}.</span>
      {title}
    </h3>
  )
}

interface ListEditorProps {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  ordered?: boolean
}
function ListEditor({
  items,
  onChange,
  placeholder = "Adicionar item",
  ordered = false,
}: ListEditorProps) {
  const updateItem = (i: number, v: string) => {
    const next = [...items]
    next[i] = v
    onChange(next)
  }
  const removeItem = (i: number) => onChange(items.filter((_, j) => j !== i))
  const addItem = () => onChange([...items, ""])

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={`item-${i}`} className="group flex items-start gap-2">
          <span className="text-muted-foreground mt-1.5 flex-shrink-0 text-xs tabular-nums">
            {ordered ? `${i + 1}.` : "•"}
          </span>
          <EditableText
            value={item}
            onChange={(v) => updateItem(i, v)}
            placeholder={placeholder}
            multiline
            rows={1}
            className="text-sm"
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            aria-label="Remover item"
            className="text-muted-foreground/0 hover:text-destructive group-hover:text-muted-foreground mt-1 flex-shrink-0 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        {placeholder}
      </button>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   AtaPanel
   ──────────────────────────────────────────────────────────────── */

const STATUS_OPTIONS: AtaStatus[] = [
  "Não iniciado",
  "Em andamento",
  "Concluído",
]

export function AtaPanel({
  transcriptionId,
  transcription,
  segments,
  intelligence,
}: AtaPanelProps) {
  const { user } = useAuth()
  const [ata, setAta] = useState<Ata | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastSource, setLastSource] = useState<"llm" | "local" | null>(null)
  const [lastReason, setLastReason] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)

  const editable = ata ? canEdit(ata, user) : true
  const deletable = ata ? canDelete(ata, user) : false

  useEffect(() => {
    const cached = loadCachedAta(transcriptionId)
    if (cached) setAta(cached)
  }, [transcriptionId])

  // Save to cache whenever ata changes (after the initial hydration)
  useEffect(() => {
    if (ata) saveCachedAta(transcriptionId, ata)
  }, [ata, transcriptionId])

  const generateAta = useCallback(
    async (force = false) => {
      setIsGenerating(true)
      try {
        const result = await generateAtaService({
          transcription,
          segments,
          intelligence,
          currentUser: user
            ? { uid: user.uid, displayName: user.displayName }
            : undefined,
        })
        setAta(result.ata)
        setLastSource(result.source)
        setLastReason(result.reason ?? null)
        if (result.source === "llm") {
          toast.success(force ? "Ata regenerada com IA" : "Ata gerada com IA")
        } else {
          toast.warning(
            force ? "Ata regenerada localmente" : "Ata gerada localmente",
            {
              description: result.reason ?? undefined,
            },
          )
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao gerar a ata")
      } finally {
        setIsGenerating(false)
      }
    },
    [transcription, segments, intelligence],
  )

  const handleRegenerate = useCallback(async () => {
    clearCachedAta(transcriptionId)
    await generateAta(true)
  }, [transcriptionId, generateAta])

  const update = useCallback(<K extends keyof Ata>(key: K, value: Ata[K]) => {
    setAta((prev) => (prev ? { ...prev, [key]: value } : prev))
  }, [])

  const triggerDownload = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }, [])

  const safeTitle = useCallback(
    () => ata?.titulo.replace(/[^\p{L}\p{N}\s-]/gu, "").trim() || "ata",
    [ata],
  )

  const handleCopy = useCallback(async () => {
    if (!ata) return
    try {
      await navigator.clipboard.writeText(ataToMarkdown(ata))
      setCopied(true)
      toast.success("Ata copiada como Markdown")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Não consegui acessar a área de transferência")
    }
  }, [ata])

  const handleDownloadMd = useCallback(() => {
    if (!ata) return
    const md = ataToMarkdown(ata)
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
    triggerDownload(blob, `${safeTitle()}.md`)
  }, [ata, triggerDownload, safeTitle])

  const handleDownloadDocx = useCallback(async () => {
    if (!ata) return
    try {
      const blob = await buildAtaDocx(ata)
      triggerDownload(blob, `${safeTitle()}.docx`)
    } catch (err) {
      console.error("Falha ao gerar .docx", err)
      toast.error("Não consegui gerar o .docx")
    }
  }, [ata, triggerDownload, safeTitle])

  // Loading state
  if (isGenerating && !ata) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
        <Loader2 className="text-foreground mb-6 h-10 w-10 animate-spin" />
        <h3 className="text-foreground mb-2 text-lg font-semibold tracking-tight">
          Gerando ata...
        </h3>
        <p className="text-muted-foreground max-w-sm text-sm">
          Analisando a transcrição e estruturando a ata. Pode levar até 1
          minuto.
        </p>
      </div>
    )
  }

  // Empty state
  if (!ata) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
        <div className="bg-foreground mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <FileText className="text-background h-8 w-8" />
        </div>
        <h3 className="text-foreground mb-2 text-xl font-semibold tracking-tight">
          Gerar ata da reunião
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm text-sm">
          A IA analisa a transcrição e gera uma ata completa: cabeçalho, pauta,
          decisões, plano de ação e próximos passos. Todos os campos são
          editáveis depois.
        </p>
        <Button onClick={() => generateAta()} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Gerar ata
        </Button>
      </div>
    )
  }

  /* Helpers for nested list updates */
  const updateParticipante = (
    field: "participantes" | "ausentes",
    i: number,
    patch: Partial<AtaParticipante>,
  ) => {
    const list = [...ata[field]]
    list[i] = { ...list[i], ...patch }
    update(field, list)
  }
  const removeParticipante = (
    field: "participantes" | "ausentes",
    i: number,
  ) => {
    update(
      field,
      ata[field].filter((_, j) => j !== i),
    )
  }
  const addParticipante = (field: "participantes" | "ausentes") => {
    update(field, [...ata[field], { nome: "", cargo: "" }])
  }

  const updatePlanoAcao = (i: number, patch: Partial<AtaPlanoAcao>) => {
    const list = [...ata.planoAcao]
    list[i] = { ...list[i], ...patch }
    update("planoAcao", list)
  }
  const removePlanoAcao = (i: number) => {
    update(
      "planoAcao",
      ata.planoAcao.filter((_, j) => j !== i),
    )
  }
  const addPlanoAcao = () => {
    update("planoAcao", [
      ...ata.planoAcao,
      { descricao: "", responsavel: "", prazo: "", status: "Não iniciado" },
    ])
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-border mb-6 flex flex-wrap items-center justify-end gap-2 border-b pb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {copied ? "Copiado" : "Copiar"}
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Baixar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownloadDocx}>
              <FileText className="h-4 w-4" />
              Word (.docx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadMd}>
              <AlignJustify className="h-4 w-4" />
              Markdown (.md)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEmailOpen(true)}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          <span className="hidden sm:inline">Enviar email</span>
        </Button>
        {editable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="gap-2"
            title={
              deletable
                ? undefined
                : "Você não criou esta ata, mas pode regerar."
            }
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isGenerating ? "Gerando..." : "Regenerar"}
            </span>
          </Button>
        )}
      </div>

      <EmailComposeModal
        ata={ata}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />

      <div className="space-y-10 overflow-y-auto pr-2 pb-12">
        {lastSource === "local" && (
          <div className="border-warning/40 bg-warning/10 flex items-start gap-3 rounded-xl border p-4">
            <AlertTriangle className="text-warning mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-foreground font-medium">
                Ata gerada localmente (sem IA)
              </p>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                {lastReason ?? "A chamada de IA falhou."} Pegue uma chave grátis
                em{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-4 hover:decoration-2"
                >
                  aistudio.google.com/apikey
                </a>{" "}
                e adicione{" "}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                  GOOGLE_GENERATIVE_AI_API_KEY
                </code>{" "}
                no{" "}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">
                  .env.local
                </code>{" "}
                (depois reinicie o servidor). Os campos abaixo são editáveis.
              </p>
            </div>
          </div>
        )}

        {/* Title */}
        <header>
          <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
            Ata de Reunião
          </p>
          <EditableText
            value={ata.titulo}
            onChange={(v) => update("titulo", v)}
            placeholder="Título da ata"
            className="text-foreground text-3xl font-semibold tracking-[-0.025em]"
          />
        </header>

        {/* Cabeçalho */}
        <section>
          <div className="border-border bg-muted/40 rounded-xl border p-5">
            <FieldRow label="Empresa / Área">
              <EditableText
                value={ata.empresa}
                onChange={(v) => update("empresa", v)}
                placeholder="Nome da empresa ou área"
              />
            </FieldRow>
            <FieldRow label="Projeto / Assunto">
              <EditableText
                value={ata.projetoAssunto}
                onChange={(v) => update("projetoAssunto", v)}
                placeholder="Tema principal da reunião"
              />
            </FieldRow>
            <FieldRow label="Tipo de reunião">
              <EditableText
                value={ata.tipoReuniao}
                onChange={(v) => update("tipoReuniao", v)}
                placeholder="Alinhamento / Status / Decisão / Planejamento"
              />
            </FieldRow>
            <FieldRow label="Data">
              <EditableText
                value={ata.data}
                onChange={(v) => update("data", v)}
                placeholder="dd/mm/aaaa"
              />
            </FieldRow>
            <FieldRow label="Horário de início">
              <EditableText
                value={ata.horarioInicio}
                onChange={(v) => update("horarioInicio", v)}
                placeholder="hh:mm"
              />
            </FieldRow>
            <FieldRow label="Horário de término">
              <EditableText
                value={ata.horarioTermino}
                onChange={(v) => update("horarioTermino", v)}
                placeholder="hh:mm"
              />
            </FieldRow>
            <FieldRow label="Local / Plataforma">
              <EditableText
                value={ata.localPlataforma}
                onChange={(v) => update("localPlataforma", v)}
                placeholder="Sala / Google Meet / Zoom / Teams"
              />
            </FieldRow>
            <FieldRow label="Responsável pela ata">
              <EditableText
                value={ata.responsavelAta}
                onChange={(v) => update("responsavelAta", v)}
                placeholder="Nome"
              />
            </FieldRow>
            <FieldRow label="Líder da reunião">
              <EditableText
                value={ata.liderReuniao}
                onChange={(v) => update("liderReuniao", v)}
                placeholder="Nome"
              />
            </FieldRow>
          </div>
        </section>

        {/* 1. Objetivo */}
        <section>
          <SectionHeader number="1" title="Objetivo da reunião" />
          <EditableText
            value={ata.objetivo}
            onChange={(v) => update("objetivo", v)}
            placeholder="Descreva o propósito da reunião."
            multiline
            rows={3}
            className="text-sm"
          />
        </section>

        {/* 2. Participantes */}
        <section>
          <SectionHeader number="2" title="Participantes" />
          <div className="space-y-2">
            {ata.participantes.map((p, i) => (
              <div
                key={`part-${i}`}
                className="group grid grid-cols-[1fr_1fr_auto] items-center gap-3"
              >
                <EditableText
                  value={p.nome}
                  onChange={(v) =>
                    updateParticipante("participantes", i, { nome: v })
                  }
                  placeholder="Nome"
                  className="text-sm"
                />
                <EditableText
                  value={p.cargo}
                  onChange={(v) =>
                    updateParticipante("participantes", i, { cargo: v })
                  }
                  placeholder="Cargo / área"
                  className="text-muted-foreground text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeParticipante("participantes", i)}
                  aria-label="Remover participante"
                  className="text-muted-foreground/0 hover:text-destructive group-hover:text-muted-foreground transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addParticipante("participantes")}
              className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar participante
            </button>
          </div>

          {(ata.ausentes.length > 0 || ata.participantes.length > 0) && (
            <div className="mt-5">
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
                Ausentes
              </p>
              <div className="space-y-2">
                {ata.ausentes.map((p, i) => (
                  <div
                    key={`abs-${i}`}
                    className="group grid grid-cols-[1fr_1fr_auto] items-center gap-3"
                  >
                    <EditableText
                      value={p.nome}
                      onChange={(v) =>
                        updateParticipante("ausentes", i, { nome: v })
                      }
                      placeholder="Nome"
                      className="text-sm"
                    />
                    <EditableText
                      value={p.cargo}
                      onChange={(v) =>
                        updateParticipante("ausentes", i, { cargo: v })
                      }
                      placeholder="Cargo / área"
                      className="text-muted-foreground text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeParticipante("ausentes", i)}
                      aria-label="Remover ausente"
                      className="text-muted-foreground/0 hover:text-destructive group-hover:text-muted-foreground transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addParticipante("ausentes")}
                  className="text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar ausente
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. Pauta */}
        <section>
          <SectionHeader number="3" title="Pauta" />
          <ListEditor
            items={ata.pauta}
            onChange={(v) => update("pauta", v)}
            placeholder="Item da pauta"
            ordered
          />
        </section>

        {/* 4. Discussões */}
        <section>
          <SectionHeader number="4" title="Resumo das discussões" />
          <div className="space-y-6">
            {ata.discussoes.map((d, i) => (
              <div key={`disc-${i}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-muted-foreground text-sm font-medium tabular-nums">
                    4.{i + 1}.
                  </span>
                  <EditableText
                    value={d.topico}
                    onChange={(v) => {
                      const list = [...ata.discussoes]
                      list[i] = { ...d, topico: v }
                      update("discussoes", list)
                    }}
                    placeholder="Item da pauta"
                    className="text-foreground text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        "discussoes",
                        ata.discussoes.filter((_, j) => j !== i),
                      )
                    }
                    aria-label="Remover discussão"
                    className="text-muted-foreground/40 hover:text-destructive flex-shrink-0 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="pl-6">
                  <ListEditor
                    items={d.pontos}
                    onChange={(pts) => {
                      const list = [...ata.discussoes]
                      list[i] = { ...d, pontos: pts }
                      update("discussoes", list)
                    }}
                    placeholder="Adicionar ponto"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                update("discussoes", [
                  ...ata.discussoes,
                  { topico: "", pontos: [] },
                ])
              }
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar tópico
            </button>
          </div>
        </section>

        {/* 5. Decisões */}
        <section>
          <SectionHeader number="5" title="Decisões tomadas" />
          <ListEditor
            items={ata.decisoes}
            onChange={(v) => update("decisoes", v)}
            placeholder="Adicionar decisão"
          />
        </section>

        {/* 6. Pendências */}
        <section>
          <SectionHeader number="6" title="Pendências identificadas" />
          <ListEditor
            items={ata.pendencias}
            onChange={(v) => update("pendencias", v)}
            placeholder="Adicionar pendência"
          />
        </section>

        {/* 7. Plano de Ação */}
        <section>
          <SectionHeader number="7" title="Plano de ação" />
          <div className="space-y-3">
            {ata.planoAcao.map((item, i) => (
              <div
                key={`act-${i}`}
                className="border-border bg-card group rounded-xl border p-4"
              >
                <div className="mb-3 flex items-start gap-2">
                  <span className="text-muted-foreground mt-1.5 text-xs font-medium tabular-nums">
                    Ação {i + 1}
                  </span>
                  <div className="flex-1">
                    <EditableText
                      value={item.descricao}
                      onChange={(v) => updatePlanoAcao(i, { descricao: v })}
                      placeholder="O que será feito"
                      multiline
                      rows={1}
                      className="text-sm font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePlanoAcao(i)}
                    aria-label="Remover ação"
                    className="text-muted-foreground/40 hover:text-destructive mt-1.5 flex-shrink-0 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 pl-16 sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-xs uppercase tracking-wider">
                      Responsável
                    </p>
                    <EditableText
                      value={item.responsavel}
                      onChange={(v) => updatePlanoAcao(i, { responsavel: v })}
                      placeholder="Nome"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-xs uppercase tracking-wider">
                      Prazo
                    </p>
                    <EditableText
                      value={item.prazo}
                      onChange={(v) => updatePlanoAcao(i, { prazo: v })}
                      placeholder="Data"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5 text-xs uppercase tracking-wider">
                      Status
                    </p>
                    <select
                      value={item.status ?? "Não iniciado"}
                      onChange={(e) =>
                        updatePlanoAcao(i, {
                          status: e.target.value as AtaStatus,
                        })
                      }
                      className={`${EDITABLE_INPUT} text-sm`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addPlanoAcao}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar ação
            </button>
          </div>
        </section>

        {/* 8. Riscos / observações */}
        <section>
          <SectionHeader
            number="8"
            title="Riscos, pontos de atenção e observações"
          />
          <ListEditor
            items={ata.riscosObservacoes}
            onChange={(v) => update("riscosObservacoes", v)}
            placeholder="Adicionar observação"
          />
        </section>

        {/* 9. Próximos passos */}
        <section>
          <SectionHeader number="9" title="Próximos passos" />
          <ListEditor
            items={ata.proximosPassos}
            onChange={(v) => update("proximosPassos", v)}
            placeholder="Adicionar próximo passo"
          />
        </section>

        {/* 10. Próxima reunião */}
        <section>
          <SectionHeader number="10" title="Próxima reunião" />
          <div className="border-border bg-muted/40 rounded-xl border p-5">
            <FieldRow label="Data prevista">
              <EditableText
                value={ata.proximaReuniao?.data}
                onChange={(v) =>
                  update("proximaReuniao", {
                    ...(ata.proximaReuniao ?? {}),
                    data: v,
                  })
                }
                placeholder="dd/mm/aaaa"
              />
            </FieldRow>
            <FieldRow label="Horário">
              <EditableText
                value={ata.proximaReuniao?.horario}
                onChange={(v) =>
                  update("proximaReuniao", {
                    ...(ata.proximaReuniao ?? {}),
                    horario: v,
                  })
                }
                placeholder="hh:mm"
              />
            </FieldRow>
            <FieldRow label="Local / Plataforma">
              <EditableText
                value={ata.proximaReuniao?.local}
                onChange={(v) =>
                  update("proximaReuniao", {
                    ...(ata.proximaReuniao ?? {}),
                    local: v,
                  })
                }
                placeholder="Sala / Google Meet / Zoom"
              />
            </FieldRow>
            <FieldRow label="Objetivo">
              <EditableText
                value={ata.proximaReuniao?.objetivo}
                onChange={(v) =>
                  update("proximaReuniao", {
                    ...(ata.proximaReuniao ?? {}),
                    objetivo: v,
                  })
                }
                placeholder="Propósito da próxima reunião"
              />
            </FieldRow>
          </div>
        </section>

        {/* 11. Encerramento */}
        <section>
          <SectionHeader number="11" title="Encerramento" />
          <p className="text-muted-foreground text-sm leading-relaxed">
            Nada mais havendo a tratar, a reunião foi encerrada às{" "}
            <span className="text-foreground">
              <EditableText
                value={ata.horarioEncerramento}
                onChange={(v) => update("horarioEncerramento", v)}
                placeholder="hh:mm"
                className="inline-block w-20 text-sm"
              />
            </span>
            , e esta ata foi registrada por{" "}
            <span className="text-foreground">
              <EditableText
                value={ata.responsavelAta}
                onChange={(v) => update("responsavelAta", v)}
                placeholder="Nome"
                className="inline-block w-40 text-sm"
              />
            </span>
            .
          </p>
        </section>

        <footer className="border-border text-muted-foreground border-t pt-4 text-xs">
          Gerada em {new Date(ata.geradaEm).toLocaleString("pt-BR")} pelo
          LegacyPlanning
        </footer>
      </div>
    </div>
  )
}
