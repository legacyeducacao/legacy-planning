"use client"

import {
  Check,
  Copy,
  Download,
  Loader2,
  Mail,
  Send,
  Sparkles,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { buildAtaDocx } from "@/lib/ata-docx"
import { ataToPlainText } from "@/lib/ata-format"
import type { Ata } from "@/types/transcription"

type EmailMode = "resumo" | "completa"

const FULL_ATA_SEPARATOR = "\n\n———————————————————————————\n\nATA COMPLETA\n\n"

interface EmailComposeModalProps {
  ata: Ata
  open: boolean
  onOpenChange: (open: boolean) => void
}

function buildGmailComposeUrl(opts: {
  to?: string
  cc?: string
  subject: string
  body: string
}) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    su: opts.subject,
    body: opts.body,
  })
  if (opts.to) params.set("to", opts.to)
  if (opts.cc) params.set("cc", opts.cc)
  return `https://mail.google.com/mail/?${params.toString()}`
}

function buildMailtoUrl(opts: {
  to?: string
  cc?: string
  subject: string
  body: string
}) {
  const params = new URLSearchParams()
  params.set("subject", opts.subject)
  params.set("body", opts.body)
  if (opts.cc) params.set("cc", opts.cc)
  const query = params.toString()
  return `mailto:${opts.to ?? ""}?${query}`
}

// Gmail compose rejeita URLs muito grandes com 400 Bad Request. Limite
// empírico em torno de 7-8KB de URL total; fica abaixo pra ter margem.
const GMAIL_URL_LIMIT = 6500
// mailto: tem limite mais agressivo em vários clientes; manter conservador.
const MAILTO_URL_LIMIT = 2000

/** Deriva o assunto direto da ata, sem chamar IA. Formato:
 *  "Ata — Título — DD/MM/YYYY" (truncado em 80 chars). */
function deriveSubject(ata: Ata): string {
  const titulo = ata.titulo.replace(
    /^Ata\s*(da Reunião|de Reunião)?\s*[—-]\s*/i,
    "",
  )
  const parts = ["Ata", titulo]
  if (ata.data) parts.push(ata.data)
  const subject = parts.filter(Boolean).join(" — ")
  return subject.length > 80 ? `${subject.slice(0, 77)}...` : subject
}

export function EmailComposeModal({
  ata,
  open,
  onOpenChange,
}: EmailComposeModalProps) {
  const { user } = useAuth()
  const [to, setTo] = useState("")
  const [cc, setCc] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [summary, setSummary] = useState("") // Resumo "puro" vindo da API
  const [mode, setMode] = useState<EmailMode>("resumo")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const hasFetchedRef = useRef(false)

  const composeBody = useCallback(
    (sum: string, m: EmailMode) =>
      m === "completa" && sum
        ? `${sum}${FULL_ATA_SEPARATOR}${ataToPlainText(ata)}`
        : sum,
    [ata],
  )

  // Trocar o toggle reescreve o body. Edições manuais no body permanecem até
  // o usuário trocar o mode ou regenerar.
  const handleModeChange = useCallback(
    (m: EmailMode) => {
      setMode(m)
      setBody(composeBody(summary, m))
    },
    [composeBody, summary],
  )

  const generate = useCallback(async () => {
    setIsGenerating(true)
    // Assunto é deterministico — calcula local pra não pagar latência de IA
    setSubject(deriveSubject(ata))
    setSummary("")
    setBody("")
    try {
      const response = await fetch("/api/ata/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ata,
          signature: user?.displayName,
        }),
      })
      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({}))
        if (err.error === "GOOGLE_GENERATIVE_AI_API_KEY_MISSING") {
          toast.error(
            "Configure GOOGLE_GENERATIVE_AI_API_KEY no .env.local pra gerar emails",
          )
        } else {
          toast.error(err.error || `Erro ${response.status}`)
        }
        return
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let acc = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setSummary(acc)
        setBody(composeBody(acc, mode))
      }
      acc += decoder.decode()
      if (acc) {
        setSummary(acc)
        setBody(composeBody(acc, mode))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar email")
    } finally {
      setIsGenerating(false)
    }
  }, [ata, mode, composeBody, user])

  // Auto-gera o rascunho ao abrir pela primeira vez
  useEffect(() => {
    if (open && !hasFetchedRef.current && !subject && !body) {
      hasFetchedRef.current = true
      generate()
    }
  }, [open, generate, subject, body])

  // Reset flag quando fecha
  useEffect(() => {
    if (!open) hasFetchedRef.current = false
  }, [open])

  const handleCopy = useCallback(async () => {
    const text = `Assunto: ${subject}\n\n${body}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Email copiado")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Não consegui acessar a área de transferência")
    }
  }, [subject, body])

  const handleOpenGmail = useCallback(async () => {
    const url = buildGmailComposeUrl({ to, cc, subject, body })
    if (url.length <= GMAIL_URL_LIMIT) {
      window.open(url, "_blank", "noopener,noreferrer")
      return
    }
    // Email grande demais pro URL do Gmail — copia corpo, abre só com headers
    try {
      await navigator.clipboard.writeText(body)
      toast.info(
        "Email grande demais pra URL do Gmail. Corpo copiado — cola lá.",
        { duration: 6000 },
      )
    } catch {
      toast.warning(
        "Email grande demais pra URL do Gmail. Use Copiar e cole no Gmail.",
      )
      return
    }
    const stubUrl = buildGmailComposeUrl({
      to,
      cc,
      subject,
      body: "(Corpo copiado pra área de transferência — cola aqui com Ctrl+V)",
    })
    window.open(stubUrl, "_blank", "noopener,noreferrer")
  }, [to, cc, subject, body])

  const handleOpenMailto = useCallback(async () => {
    const url = buildMailtoUrl({ to, cc, subject, body })
    if (url.length <= MAILTO_URL_LIMIT) {
      window.location.href = url
      return
    }
    try {
      await navigator.clipboard.writeText(body)
      toast.info(
        "Email grande demais pro mailto. Corpo copiado — cola no cliente de email.",
        { duration: 6000 },
      )
    } catch {
      toast.warning(
        "Email grande demais pro mailto. Use Copiar e cole manualmente.",
      )
      return
    }
    const stubUrl = buildMailtoUrl({
      to,
      cc,
      subject,
      body: "(Corpo copiado pra área de transferência — cola aqui com Ctrl+V)",
    })
    window.location.href = stubUrl
  }, [to, cc, subject, body])

  const handleDownloadDocx = useCallback(async () => {
    try {
      const blob = await buildAtaDocx(ata)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const safeTitle =
        ata.titulo.replace(/[^\p{L}\p{N}\s-]/gu, "").trim() || "ata"
      a.href = url
      a.download = `${safeTitle}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 100)
      toast.info("Baixe agora e anexe ao email")
    } catch (err) {
      console.error(err)
      toast.error("Não consegui gerar o .docx")
    }
  }, [ata])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compartilhar ata por email</DialogTitle>
          <DialogDescription>
            Rascunho gerado a partir da ata. Edite o que precisar e abra no seu
            cliente de email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* To / Cc */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="email-to"
                className="text-muted-foreground mb-1 block text-xs font-medium uppercase tracking-wider"
              >
                Para
              </label>
              <input
                id="email-to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="email@empresa.com"
                className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>
            <div>
              <label
                htmlFor="email-cc"
                className="text-muted-foreground mb-1 block text-xs font-medium uppercase tracking-wider"
              >
                Cc (opcional)
              </label>
              <input
                id="email-cc"
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="outro@empresa.com"
                className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
              />
            </div>
          </div>

          {/* Mode toggle */}
          <div>
            <span className="text-muted-foreground mb-1 block text-xs font-medium uppercase tracking-wider">
              Modo
            </span>
            <div
              role="group"
              aria-label="Modo do email"
              className="border-border bg-muted/50 inline-flex rounded-lg border p-0.5"
            >
              {(
                [
                  { value: "resumo", label: "Resumo" },
                  { value: "completa", label: "Com ata completa" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleModeChange(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode === opt.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground mt-1.5 text-xs">
              {mode === "resumo"
                ? "Só o resumo executivo — email curto."
                : "Resumo no topo + ata inteira embaixo — bom quando ninguém vai abrir anexo."}
            </p>
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="email-subject"
              className="text-muted-foreground mb-1 block text-xs font-medium uppercase tracking-wider"
            >
              Assunto
            </label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={isGenerating ? "Gerando..." : "Assunto do email"}
              disabled={isGenerating}
              className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-60"
            />
          </div>

          {/* Body */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor="email-body"
                className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
              >
                Corpo do email
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={generate}
                disabled={isGenerating}
                className="h-7 gap-1.5 text-xs"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {isGenerating ? "Gerando..." : "Regenerar"}
              </Button>
            </div>
            <textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                isGenerating
                  ? "A IA está escrevendo o email..."
                  : "Corpo do email"
              }
              disabled={isGenerating}
              rows={12}
              className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-60"
            />
          </div>

          {/* Hint sobre anexo */}
          <div className="border-border bg-muted/40 rounded-lg border p-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">
                Sobre anexar a ata:
              </span>{" "}
              mailto e Gmail compose não suportam anexos via link. Use{" "}
              <span className="text-foreground font-medium">
                Com ata completa
              </span>{" "}
              pra incluir tudo no email (se ficar grande demais, o corpo é
              copiado pra área de transferência automaticamente), ou baixe o
              .docx e anexe manualmente.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadDocx}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar .docx
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!body || isGenerating}
            className="gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenMailto}
            disabled={!body || isGenerating}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Email padrão
          </Button>
          <Button
            size="sm"
            onClick={handleOpenGmail}
            disabled={!body || isGenerating}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Abrir no Gmail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
