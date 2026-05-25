"use client"

import { Loader2, MessageSquare } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Ata } from "@/types/transcription"

interface DiscordComposeModalProps {
  ata: Ata
  webhookUrl: string
  open: boolean
  onOpenChange: (open: boolean) => void
  senderName?: string
}

const DISCORD_CONTENT_LIMIT = 2000

function ataToMarkdown(ata: Ata): string {
  const lines: string[] = []
  lines.push(`**${ata.titulo || "Ata de Reunião"}**`)
  const header: string[] = []
  if (ata.empresa) header.push(ata.empresa)
  if (ata.data) header.push(ata.data)
  if (ata.tipoReuniao) header.push(ata.tipoReuniao)
  if (header.length > 0) lines.push(`_${header.join(" · ")}_`)
  lines.push("")

  if (ata.objetivo) {
    lines.push("**Objetivo**")
    lines.push(ata.objetivo)
    lines.push("")
  }

  if (ata.participantes && ata.participantes.length > 0) {
    lines.push(`**Participantes (${ata.participantes.length})**`)
    for (const p of ata.participantes) {
      lines.push(p.cargo ? `• ${p.nome} (${p.cargo})` : `• ${p.nome}`)
    }
    lines.push("")
  }

  if (ata.decisoes && ata.decisoes.length > 0) {
    lines.push("**Decisões**")
    for (const d of ata.decisoes) lines.push(`• ${d}`)
    lines.push("")
  }

  if (ata.planoAcao && ata.planoAcao.length > 0) {
    lines.push("**Plano de ação**")
    for (const a of ata.planoAcao) {
      const parts = [`• ${a.descricao}`]
      if (a.responsavel) parts.push(`  — Resp: ${a.responsavel}`)
      if (a.prazo) parts.push(`  — Prazo: ${a.prazo}`)
      lines.push(parts.join("\n"))
    }
    lines.push("")
  }

  if (ata.proximosPassos && ata.proximosPassos.length > 0) {
    lines.push("**Próximos passos**")
    for (const p of ata.proximosPassos) lines.push(`• ${p}`)
    lines.push("")
  }

  return lines.join("\n").trim()
}

export function DiscordComposeModal({
  ata,
  webhookUrl,
  open,
  onOpenChange,
  senderName,
}: DiscordComposeModalProps) {
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)

  // Repreenche o conteúdo toda vez que abre o modal pra refletir a ata atual
  useEffect(() => {
    if (open) {
      setContent(ataToMarkdown(ata))
    }
  }, [open, ata])

  const charCount = content.length
  const tooLong = charCount > DISCORD_CONTENT_LIMIT

  const handleSend = useCallback(async () => {
    if (tooLong) {
      toast.error(
        `Mensagem tem ${charCount} caracteres — limite do Discord é ${DISCORD_CONTENT_LIMIT}. Edite pra reduzir.`,
      )
      return
    }
    if (!content.trim()) {
      toast.error("Mensagem vazia")
      return
    }
    setSending(true)
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: senderName || "LegacyPlanning",
          content,
        }),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => "")
        throw new Error(
          `Discord respondeu ${res.status}: ${body.slice(0, 200)}`,
        )
      }
      toast.success("Ata enviada pro Discord")
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error(
        err instanceof Error ? err.message : "Falha ao enviar pro Discord",
      )
    } finally {
      setSending(false)
    }
  }, [content, charCount, tooLong, webhookUrl, senderName, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar ata pro Discord</DialogTitle>
          <DialogDescription>
            Confira e edite a mensagem antes de mandar. Discord renderiza
            negrito (`**texto**`), itálico (`_texto_`) e bullets (`•`).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={sending}
            rows={18}
            className="border-border bg-background text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:ring-2 disabled:opacity-50"
          />
          <div className="flex items-center justify-between text-xs">
            <span
              className={
                tooLong
                  ? "text-destructive font-medium"
                  : "text-muted-foreground"
              }
            >
              {charCount} / {DISCORD_CONTENT_LIMIT} caracteres
            </span>
            {tooLong && (
              <span className="text-destructive">
                Excede o limite — corta antes de enviar
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending || tooLong || !content.trim()}
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
