import { Brain, Download, FileAudio, Languages, Users, Zap } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

const features = [
  {
    icon: Brain,
    title: "Análise com IA",
    description:
      "Capítulos automáticos, resumo, análise de sentimento, detecção de entidades e extração de frases-chave.",
  },
  {
    icon: Languages,
    title: "Mais de 30 idiomas",
    description:
      "Suporte pra português, inglês, espanhol, francês, alemão, árabe, chinês, japonês e muito mais.",
  },
  {
    icon: Download,
    title: "Múltiplos formatos de exportação",
    description:
      "Exporta em TXT, DOCX, SRT, VTT, JSON, CSV ou Markdown com timestamps.",
  },
  {
    icon: Zap,
    title: "Processamento rápido",
    description:
      "Powered by AssemblyAI com modelos de reconhecimento de fala state-of-the-art.",
  },
  {
    icon: Users,
    title: "Identificação de falantes",
    description:
      "Identifica e separa falantes em conversas, entrevistas e reuniões.",
  },
  {
    icon: FileAudio,
    title: "Workspace Studio",
    description:
      "Experiência completa de studio com playback de áudio, highlight estilo karaokê e atalhos de teclado.",
  },
]

const steps = [
  {
    step: "1",
    title: "Envia",
    description: "Solta um arquivo ou cola uma URL de áudio",
  },
  {
    step: "2",
    title: "Transcreve",
    description: "A IA processa teu áudio em minutos",
  },
  {
    step: "3",
    title: "Explora",
    description: "Visualiza, busca, exporta e analisa",
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-4 text-4xl font-bold text-foreground sm:text-5xl">
              Áudio para texto, <span className="text-primary">com IA</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              O LegacyPlanning converte teus arquivos de áudio em texto preciso
              e pesquisável, com transcrição por IA, identificação de falantes e
              análise inteligente.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <FileAudio className="h-4 w-4" />
              Começar a transcrever
            </Link>
          </div>
        </section>

        {/* Recursos */}
        <section className="border-t border-border px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-2xl font-bold text-foreground">
              Recursos
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <feature.icon className="mb-4 h-8 w-8 text-primary" />
                  <h3 className="mb-2 font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="border-t border-border px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-2xl font-bold text-foreground">
              Como funciona
            </h2>
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
              {steps.map((s, i) => (
                <div
                  key={s.step}
                  className="flex items-center gap-4 sm:flex-col sm:text-center"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden h-px w-16 bg-border sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border px-4 py-16 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              Pronto pra começar?
            </h2>
            <p className="mb-6 text-muted-foreground">
              Gratuito. Sem cadastro.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Começar a transcrever
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
