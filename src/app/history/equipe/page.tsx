"use client"

import { ArrowLeft, Construction, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"

/**
 * Página exclusiva do master — vai listar transcrições de OUTROS usuários.
 *
 * Hoje está em placeholder porque transcrições ficam em IndexedDB local de
 * cada browser (history-store). Pra master ver dados de outras pessoas, a
 * persistência precisa migrar pra um backend compartilhado (Firestore ou
 * Supabase Postgres). Quando isso for feito, esta página consulta o backend
 * filtrando por ownerUid != user.uid.
 */
export default function HistoryEquipePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Bloqueia acesso a não-masters
  useEffect(() => {
    if (isLoading) return
    if (!user || user.role !== "master") {
      router.replace("/history")
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== "master") {
    return null
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2 text-sm">
            <Users className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground">Visão de master</span>
          </div>
          <h1 className="text-foreground text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Transcrições da equipe
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Todas as transcrições feitas pelos outros usuários da Legacy.
          </p>
        </header>

        <div className="border-border bg-card rounded-2xl border p-8 text-center">
          <div className="bg-muted mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
            <Construction className="text-muted-foreground h-8 w-8" />
          </div>
          <h2 className="text-foreground mb-2 text-xl font-semibold tracking-tight">
            Em construção
          </h2>
          <p className="text-muted-foreground mx-auto mb-6 max-w-md text-sm leading-relaxed">
            Hoje cada usuário guarda suas transcrições localmente no próprio
            navegador (IndexedDB). Pra você ver dados dos outros, é preciso
            migrar a persistência pra um backend compartilhado (Supabase
            Postgres já está disponível no projeto). Quando essa migração rodar,
            esta página passa a listar tudo automaticamente.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/history")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar pra minhas transcrições
          </Button>
        </div>
      </div>
    </div>
  )
}
