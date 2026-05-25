"use client"

import { Users } from "lucide-react"

interface ParticipantesInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function parseParticipantesText(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function ParticipantesInput({
  value,
  onChange,
  disabled,
}: ParticipantesInputProps) {
  const names = parseParticipantesText(value)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="text-muted-foreground h-4 w-4" />
        <h3 className="text-foreground text-sm font-semibold">
          Quem estava na reunião?
        </h3>
        {names.length > 0 && (
          <span className="text-muted-foreground text-xs">
            ({names.length})
          </span>
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        Confirma os nomes pra ata vir certa. A IA usa essa lista em vez de
        inferir das menções na transcrição (que costuma dar errado). Pode deixar
        vazio se preferir que a IA infira sozinha.
      </p>

      <textarea
        id="participantes-list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
        placeholder="Allan&#10;Clailton&#10;Lair&#10;Adriano"
        className="border-border bg-background text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 disabled:opacity-50"
      />
      <p className="text-muted-foreground text-[10px]">
        Um por linha OU separados por vírgula. Os cargos vão sair do organograma
        da Legacy automaticamente.
      </p>

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
  )
}
