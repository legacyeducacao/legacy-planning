"use client"

import { BookOpen, Home, RefreshCw, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { ErrorState } from "@/components/errors/ErrorState"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Global error boundary triggered:", error)
    } else if (error.digest) {
      console.error(`Global error (${error.digest})`)
    }
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ minHeight: "100vh" }} className="bg-background font-sans">
        <main className="flex min-h-screen items-center px-4 py-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <div className="px-1">
              <Link
                href="/"
                className="text-foreground text-lg font-semibold tracking-tight"
              >
                LegacyPlanning
              </Link>
            </div>

            <ErrorState
              code="500"
              status="Erro crítico global"
              title="O app teve uma falha crítica"
              description="Um erro de raiz interrompeu a aplicação antes da tela atual conseguir se recuperar."
              icon={TriangleAlert}
              tone="danger"
              note={
                error.digest
                  ? `Referência: ${error.digest}`
                  : "Usa as ações abaixo pra reiniciar o app ou voltar pra uma rota estável."
              }
              hints={[
                "Usa 'Reiniciar app' primeiro pra reinicializar o shell.",
                "Volta pra home se a rota atual não recupera.",
                "Abre os docs se precisar de uma rota estável enquanto investiga.",
              ]}
              actions={
                <>
                  <Button onClick={reset}>
                    <RefreshCw className="h-4 w-4" />
                    Reiniciar app
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">
                      <Home className="h-4 w-4" />
                      Ir pro início
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/documentation">
                      <BookOpen className="h-4 w-4" />
                      Abrir docs
                    </Link>
                  </Button>
                </>
              }
            />
          </div>
        </main>
      </body>
    </html>
  )
}
