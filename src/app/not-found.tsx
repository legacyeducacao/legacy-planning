import { BookOpen, FileSearch, Home } from "lucide-react"
import Link from "next/link"
import { ErrorState } from "@/components/errors/ErrorState"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex flex-1 items-center px-4 py-10">
        <div className="container mx-auto max-w-5xl">
          <ErrorState
            code="404"
            status="Página não encontrada"
            title="Essa rota não existe"
            description="A página pode ter sido movida, a URL pode estar errada, ou o recurso não está mais disponível."
            icon={FileSearch}
            tone="info"
            hints={[
              "Confere a URL em busca de erro de digitação ou parte faltando.",
              "Volta pra home e recomeça o fluxo de uma rota estável.",
              "Usa docs ou novidades se estava tentando achar info do produto.",
            ]}
            actions={
              <>
                <Button asChild>
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    Voltar pro início
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
