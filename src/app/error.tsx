"use client"

import { BookOpen, Home, RefreshCw, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { ErrorState } from "@/components/errors/ErrorState"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"

export default function RouteError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Route error boundary triggered:", error)
    } else if (error.digest) {
      console.error(`Route error (${error.digest})`)
    }
  }, [error])

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center px-4 py-10">
        <div className="container mx-auto max-w-5xl">
          <ErrorState
            code="500"
            status="Erro da aplicação"
            title="Esta tela falhou ao carregar"
            description="Algo deu errado ao renderizar a página ou ao buscar os dados que ela precisa."
            icon={TriangleAlert}
            tone="danger"
            note={
              error.digest
                ? `Referência: ${error.digest}`
                : "Tenta de novo primeiro. Se repetir, manda feedback descrevendo o que fez."
            }
            hints={[
              "Repete a ação — pode ter sido falha temporária.",
              "Volta pra página anterior estável se estava no meio de um fluxo.",
              "Confere as novidades se isso começou depois de uma atualização recente.",
            ]}
            actions={
              <>
                <Button onClick={() => reset()}>
                  <RefreshCw className="h-4 w-4" />
                  Tentar de novo
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

      <Footer />
    </div>
  )
}
