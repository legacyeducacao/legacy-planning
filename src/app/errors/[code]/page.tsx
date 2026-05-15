import type { LucideIcon } from "lucide-react"
import {
  Ban,
  BookOpen,
  Clock3,
  Home,
  ShieldAlert,
  TriangleAlert,
  WifiOff,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ErrorState } from "@/components/errors/ErrorState"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"

interface ErrorCodeConfig {
  code: string
  status: string
  title: string
  description: string
  hints: string[]
  tone: "warning" | "danger" | "info"
  icon: LucideIcon
}

const errorCodePages: Record<string, ErrorCodeConfig> = {
  "401": {
    code: "401",
    status: "Autenticação necessária",
    title: "Você precisa fazer login antes de continuar",
    description:
      "Este recurso exige uma sessão autenticada antes de poder ser acessado.",
    tone: "warning",
    icon: ShieldAlert,
    hints: [
      "Verifica se o fluxo de sessão ou credencial completou com sucesso.",
      "Começa de novo a partir de uma rota estável se foi redirecionado pra cá sem querer.",
      "Confere se o serviço upstream expirou tua sessão silenciosamente.",
    ],
  },
  "403": {
    code: "403",
    status: "Acesso negado",
    title: "Teu nível de acesso atual não consegue abrir isso",
    description:
      "A rota existe, mas a requisição foi bloqueada por uma checagem de permissão ou política.",
    tone: "warning",
    icon: Ban,
    hints: [
      "Confirma que a conta ou token usado tem as permissões esperadas.",
      "Volta pra uma rota que não exija acesso elevado.",
      "Se for inesperado, revisa a política de acesso ou as configs de ambiente.",
    ],
  },
  "429": {
    code: "429",
    status: "Muitas requisições",
    title: "O fluxo precisa de um minuto",
    description:
      "A taxa de requisições está acima do limite permitido temporariamente, então o sistema tá pedindo pra esperar.",
    tone: "warning",
    icon: Clock3,
    hints: [
      "Espera um pouquinho antes de tentar a mesma ação de novo.",
      "Evita refresh ou submissões repetidas rapidamente.",
      "Se acontece sempre, reduz polling ou rajadas de requisições do cliente.",
    ],
  },
  "500": {
    code: "500",
    status: "Erro interno do servidor",
    title: "O servidor teve uma falha inesperada",
    description:
      "A requisição chegou ao backend, mas algo falhou antes de retornar uma resposta válida.",
    tone: "danger",
    icon: TriangleAlert,
    hints: [
      "Tenta de novo uma vez — pode ter sido falha transitória.",
      "Usa as novidades como primeiro lugar pra investigar regressões recentes.",
      "Anota o caminho da ação que falhou pra ajudar a reproduzir.",
    ],
  },
  "503": {
    code: "503",
    status: "Serviço indisponível",
    title: "O serviço de transcrição está fora do ar temporariamente",
    description:
      "Um serviço upstream necessário está indisponível ou ainda aquecendo, então a requisição não pode completar agora.",
    tone: "danger",
    icon: WifiOff,
    hints: [
      "Aguarda e tenta de novo depois do serviço se recuperar.",
      "Volta pra uma rota estável se só precisa navegar ou revisar.",
      "Se o problema persistir, é questão de infra, não do cliente.",
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(errorCodePages).map((code) => ({ code }))
}

export default async function ErrorCodePage({
  params,
}: Readonly<{
  params: Promise<{ code: string }>
}>) {
  const { code } = await params
  const config = errorCodePages[code]

  if (!config) {
    notFound()
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center px-4 py-10">
        <div className="container mx-auto max-w-5xl">
          <ErrorState
            code={config.code}
            status={config.status}
            title={config.title}
            description={config.description}
            icon={config.icon}
            tone={config.tone}
            hints={config.hints}
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
