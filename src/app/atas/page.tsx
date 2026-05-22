"use client"

import { FileText, Sparkles, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { normalizeAta } from "@/lib/ata-format"
import { canView } from "@/lib/permissions"
import type { AuthUser } from "@/types/auth"
import type { Ata } from "@/types/transcription"

interface AtaSummary {
  id: string
  titulo: string
  geradaEm: string
  data?: string
  participantes: number
  acoes: number
  decisoes: number
}

function readAtas(user: AuthUser | null): AtaSummary[] {
  if (typeof localStorage === "undefined") return []
  const out: AtaSummary[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith("ata_")) continue
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as Ata & {
        ownerUid?: string
        aprovada?: boolean
      }
      const ata = {
        ...normalizeAta(parsed),
        ownerUid: parsed.ownerUid,
        aprovada: parsed.aprovada,
      }

      // Aplica permissão: padrão só vê aprovadas + próprias; master vê tudo
      if (!canView(ata, user)) continue

      out.push({
        id: key.slice("ata_".length),
        titulo: ata.titulo ?? "Ata de Reunião",
        geradaEm: ata.geradaEm,
        data: ata.data,
        participantes: ata.participantes.length,
        acoes: ata.planoAcao.length,
        decisoes: ata.decisoes.length,
      })
    } catch {
      // skip
    }
  }
  out.sort(
    (a, b) => new Date(b.geradaEm).getTime() - new Date(a.geradaEm).getTime(),
  )
  return out
}

export default function AtasPage() {
  const { user } = useAuth()
  const [atas, setAtas] = useState<AtaSummary[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setAtas(readAtas(user))
    setIsLoaded(true)
  }, [user])

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <header className="mb-10">
          <h1 className="text-foreground text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Atas
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Todas as atas geradas a partir das suas transcrições.
          </p>
        </header>

        {isLoaded && atas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-muted mb-6 flex h-16 w-16 items-center justify-center rounded-full">
              <FileText className="text-muted-foreground h-8 w-8" />
            </div>
            <h2 className="text-foreground mb-2 text-xl font-semibold tracking-tight">
              Nenhuma ata ainda
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm text-sm">
              Gere a ata de uma transcrição no Studio e ela aparece aqui.
            </p>
            <Button asChild className="gap-2">
              <Link href="/">
                <Sparkles className="h-4 w-4" />
                Nova transcrição
              </Link>
            </Button>
          </div>
        )}

        <ul className="space-y-3">
          {atas.map((ata) => (
            <li key={ata.id}>
              <Link
                href={`/atas/${ata.id}`}
                className="border-border bg-card hover:border-foreground/30 block rounded-2xl border p-5 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-foreground text-lg font-semibold tracking-tight">
                      {ata.titulo}
                    </h2>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {ata.participantes} participante
                        {ata.participantes === 1 ? "" : "s"}
                      </span>
                      <span>
                        <span className="font-medium">Decisões:</span>{" "}
                        {ata.decisoes}
                      </span>
                      <span>
                        <span className="font-medium">Ações:</span> {ata.acoes}
                      </span>
                    </div>
                  </div>
                  <div className="text-muted-foreground flex-shrink-0 text-right text-xs">
                    {ata.data ? (
                      <div className="text-foreground font-medium">
                        {ata.data}
                      </div>
                    ) : null}
                    <div className="tabular-nums">
                      {new Date(ata.geradaEm).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
