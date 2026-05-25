"use client"

import { Loader2, Sparkles, Users } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmParticipantesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Chamada quando user confirma. Lista de nomes (strings) que estavam
   *  na reunião. Pode ser vazia se ele preferir deixar a IA inferir. */
  onConfirm: (participantes: string[]) => Promise<void> | void
  isGenerating?: boolean
}

export function ConfirmParticipantesModal({
  open,
  onOpenChange,
  onConfirm,
  isGenerating = false,
}: ConfirmParticipantesModalProps) {
  const [text, setText] = useState("")

  const parseNames = (raw: string): string[] => {
    return raw
      .split(/[,\n]/) // vírgula OU quebra de linha
      .map((s) => s.trim())
      .filter(Boolean)
  }

  const names = parseNames(text)

  const handleConfirm = async () => {
    await onConfirm(names)
    setText("") // reset pra próxima vez
  }

  const handleSkip = async () => {
    await onConfirm([]) // deixa a IA inferir sozinha
    setText("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="text-primary h-5 w-5" />
            Quem estava na reunião?
          </DialogTitle>
          <DialogDescription>
            Confirma os nomes pra ata vir certa. A IA usa essa lista em vez de
            inferir das menções na transcrição (que costuma dar errado).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="participantes-list"
              className="text-foreground mb-1.5 block text-sm font-medium"
            >
              Nomes
            </label>
            <textarea
              id="participantes-list"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isGenerating}
              rows={6}
              placeholder="Allan&#10;Clailton&#10;Lair&#10;Adriano"
              className="border-border bg-background text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 disabled:opacity-50"
            />
            <p className="text-muted-foreground mt-1.5 text-xs">
              Um por linha OU separados por vírgula. Os cargos vão sair do
              organograma da Legacy automaticamente.
            </p>
          </div>

          {names.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {names.map((n) => (
                <span
                  key={n}
                  className="bg-muted text-foreground rounded-full px-2.5 py-0.5 text-xs font-medium"
                >
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isGenerating}
            className="text-muted-foreground"
          >
            Pular (deixa a IA inferir)
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isGenerating || names.length === 0}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? "Gerando..." : "Gerar ata"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
