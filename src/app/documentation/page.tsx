"use client"

import {
  BookOpen,
  Brain,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  FileAudio,
  FileVideo,
  Globe2,
  History,
  Languages,
  MessageSquareMore,
  Settings2,
  ShieldCheck,
  Wrench,
} from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

const guideSections = [
  { href: "#quick-start", title: "Início rápido" },
  { href: "#features", title: "Recursos" },
  { href: "#formats", title: "Formatos suportados" },
  { href: "#troubleshooting", title: "Solução de problemas" },
  { href: "#faq", title: "FAQ" },
]

const quickStartSteps = [
  {
    step: "01",
    icon: FileAudio,
    title: "Enviar áudio",
    description:
      "Arrasta um arquivo ou cola uma URL direta de áudio pra começar uma nova transcrição.",
  },
  {
    step: "02",
    icon: Settings2,
    title: "Escolher opções",
    description:
      "Define idioma, identificação de falantes e análise por IA opcional antes de enviar.",
  },
  {
    step: "03",
    icon: Clock3,
    title: "Acompanhar progresso",
    description:
      "Monitora o job enquanto fica na fila e processa. Se sair, reabre pelo Histórico.",
  },
  {
    step: "04",
    icon: Download,
    title: "Revisar e exportar",
    description:
      "Usa o Studio pra dar play no áudio, ler a transcrição e exportar o resultado.",
  },
]

const features = [
  {
    icon: Languages,
    title: "Transcrição multi-idioma",
    description:
      "Funciona em vários idiomas — escolhe explicitamente ou deixa detectar automaticamente.",
  },
  {
    icon: Brain,
    title: "Análise por IA",
    description:
      "Gera resumos, capítulos, sentimento, entidades, frases-chave e tópicos quando habilitado.",
  },
  {
    icon: History,
    title: "Histórico e recuperação",
    description:
      "Jobs concluídos e em progresso podem ser reabertos pelo app sem refazer o fluxo do zero.",
  },
  {
    icon: Download,
    title: "Múltiplos formatos de exportação",
    description:
      "Baixa transcrições em texto puro e formatos de documento depois de revisar.",
  },
  {
    icon: Globe2,
    title: "Entrada de áudio e vídeo",
    description:
      "Usa upload direto ou URLs de mídia suportadas, dependendo de como teu material está hospedado.",
  },
  {
    icon: ShieldCheck,
    title: "Pipeline de processamento temporário",
    description:
      "Mídia enviada é tratada pra transcrição — não é armazenamento permanente.",
  },
]

const formatGroups = [
  {
    icon: FileAudio,
    title: "Formatos de áudio",
    description:
      "Voice notes comuns, masters de podcast e formatos de arquivamento funcionam direto.",
    items: [
      "MP3, WAV e FLAC",
      "OGG, OPUS e WebM audio",
      "M4A, AAC e AIFF",
      "WMA, CAF e outras variantes suportadas",
    ],
  },
  {
    icon: FileVideo,
    title: "Formatos de vídeo",
    description:
      "O LegacyPlanning extrai o áudio de containers de vídeo suportados antes da transcrição.",
    items: [
      "MP4 e MOV",
      "AVI e MKV",
      "WMV, FLV e M4V",
      "Outros containers padrão suportados pelo backend de transcrição",
    ],
  },
]

const troubleshootingTopics = [
  {
    icon: FileAudio,
    title: "Problemas de upload",
    tips: [
      "Confirma que o arquivo ou URL aponta pra um formato de áudio/vídeo suportado.",
      "Recarrega a página se um upload travar antes de enviar.",
      "Verifica se tua conexão está estável pra uploads grandes.",
      "Se uma URL falhar, confirma que ela é acessível direto e não tá atrás de auth.",
    ],
  },
  {
    icon: Brain,
    title: "Falhas na transcrição",
    tips: [
      "Fala mais clara e áudio mais limpo geralmente melhoram a taxa de conclusão.",
      "Se análise avançada estiver habilitada, testa uma rodada simples pra isolar o problema.",
      "Tenta o job de novo depois de uma pausa se o provedor reportar problema temporário.",
      "Usa o feedback pra falhas persistentes ligadas a um arquivo ou fluxo específico.",
    ],
  },
  {
    icon: Globe2,
    title: "Compatibilidade de navegador",
    tips: [
      "Usa uma versão atual de Chrome, Firefox, Safari ou Edge.",
      "Mantém JavaScript habilitado pra uploads, polling e playback no studio.",
      "Limpa cache do site se a UI ficar travada depois de um deploy.",
      "Desativa extensões que bloqueiam upload ou playback ao depurar.",
    ],
  },
  {
    icon: Clock3,
    title: "Dicas de performance",
    tips: [
      "Gravações mais curtas terminam mais rápido e são mais fáceis de revisar.",
      "Divide gravações muito longas se quer turnaround mais rápido.",
      "Fecha abas pesadas do navegador ao trabalhar com transcrições grandes.",
      "Usa o histórico pra reabrir trabalhos finalizados em vez de rodar o mesmo job de novo.",
    ],
  },
]

const faqItems = [
  {
    question: "Quais formatos de áudio eu posso enviar?",
    answer:
      "A maioria dos formatos comuns de áudio e vídeo é suportada direto, incluindo MP3, WAV, FLAC, OGG, M4A, AAC, MP4, MOV e mais.",
  },
  {
    question: "Meus áudios estão seguros?",
    answer:
      "O áudio é processado pra transcrição e armazenamento temporário — não é hospedagem de mídia de longo prazo.",
  },
  {
    question: "Qual o tamanho máximo de arquivo?",
    answer:
      "Os limites de tamanho dependem das restrições atuais do produto e da infra. Se um arquivo falhar, divide ou reduz antes de tentar de novo.",
  },
  {
    question: "Quão precisas são as transcrições?",
    answer:
      "A precisão depende muito da qualidade do áudio, sobreposição de falantes, escolha de idioma e ruído de fundo. Gravações limpas performam melhor.",
  },
  {
    question: "Posso editar as transcrições depois de geradas?",
    answer:
      "Você pode revisar, copiar e exportar transcrições. Edição embutida ainda é mais limitada que um editor de documento dedicado.",
  },
]

export default function DocumentationPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-8 sm:py-10">
        <div className="container mx-auto grid max-w-6xl gap-10 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-32 lg:h-fit">
            <div className="border-border bg-card/60 rounded-md border p-3">
              <p className="text-muted-foreground mb-2 flex items-center gap-2 px-2 text-xs font-medium uppercase">
                <BookOpen className="h-3.5 w-3.5" />
                Docs
              </p>
              <nav className="space-y-1">
                {guideSections.map((section) => (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="hover:bg-muted hover:text-foreground text-muted-foreground block rounded-sm px-2 py-1.5 text-sm"
                  >
                    {section.title}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <article className="max-w-3xl">
            <header className="border-border mb-10 border-b pb-8">
              <p className="text-primary mb-3 flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                Documentação do LegacyPlanning
              </p>
              <h1 className="text-foreground text-3xl font-bold tracking-normal sm:text-4xl">
                Usando o LegacyPlanning
              </h1>
              <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
                Referência prática pra enviar mídia, escolher opções de
                transcrição, revisar resultados no Studio, exportar e resolver
                problemas comuns.
              </p>
            </header>

            <section id="quick-start" className="border-border border-b py-10">
              <div className="mb-6 flex items-center gap-3">
                <FileAudio className="text-primary h-5 w-5" />
                <h2 className="text-foreground text-2xl font-semibold">
                  Início rápido
                </h2>
              </div>
              <ol className="space-y-5">
                {quickStartSteps.map((step) => (
                  <li
                    key={step.step}
                    className="grid gap-3 sm:grid-cols-[3rem_1fr]"
                  >
                    <div className="bg-muted text-muted-foreground flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold">
                      {step.step}
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <step.icon className="text-primary h-4 w-4" />
                        <h3 className="text-foreground font-semibold">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground leading-7">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section id="features" className="border-border border-b py-10">
              <div className="mb-6 flex items-center gap-3">
                <Brain className="text-primary h-5 w-5" />
                <h2 className="text-foreground text-2xl font-semibold">
                  Recursos
                </h2>
              </div>
              <div className="divide-border border-border divide-y rounded-md border">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="grid gap-3 p-4 sm:grid-cols-[1.5rem_1fr]"
                  >
                    <feature.icon className="text-primary mt-1 h-4 w-4" />
                    <div>
                      <h3 className="text-foreground font-semibold">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground mt-1 leading-7">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="formats" className="border-border border-b py-10">
              <div className="mb-6 flex items-center gap-3">
                <FileVideo className="text-primary h-5 w-5" />
                <h2 className="text-foreground text-2xl font-semibold">
                  Formatos suportados
                </h2>
              </div>
              <p className="text-muted-foreground mb-6 leading-7">
                A maioria dos formatos de mídia funciona sem conversão extra. Se
                algum arquivo falhar, tenta exportar como MP3, WAV, MP4 ou MOV.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {formatGroups.map((group) => (
                  <section
                    key={group.title}
                    className="border-border bg-card/60 rounded-md border p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <group.icon className="text-primary h-4 w-4" />
                      <h3 className="text-foreground font-semibold">
                        {group.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-4 text-sm leading-6">
                      {group.description}
                    </p>
                    <ul className="space-y-2">
                      {group.items.map((item) => (
                        <li
                          key={item}
                          className="text-muted-foreground flex gap-2 text-sm leading-6"
                        >
                          <ChevronRight className="text-primary mt-1 h-3.5 w-3.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>

            <section
              id="troubleshooting"
              className="border-border border-b py-10"
            >
              <div className="mb-6 flex items-center gap-3">
                <Wrench className="text-primary h-5 w-5" />
                <h2 className="text-foreground text-2xl font-semibold">
                  Solução de problemas
                </h2>
              </div>
              <div className="space-y-7">
                {troubleshootingTopics.map((topic) => (
                  <section key={topic.title}>
                    <div className="mb-3 flex items-center gap-2">
                      <topic.icon className="text-primary h-4 w-4" />
                      <h3 className="text-foreground font-semibold">
                        {topic.title}
                      </h3>
                    </div>
                    <ul className="border-border bg-card/60 space-y-2 rounded-md border p-4">
                      {topic.tips.map((tip) => (
                        <li
                          key={tip}
                          className="text-muted-foreground flex gap-2 leading-7"
                        >
                          <ChevronRight className="text-primary mt-1.5 h-4 w-4 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>

            <section id="faq" className="py-10">
              <div className="mb-6 flex items-center gap-3">
                <CircleHelp className="text-primary h-5 w-5" />
                <h2 className="text-foreground text-2xl font-semibold">FAQ</h2>
              </div>
              <div className="divide-border border-border divide-y rounded-md border">
                {faqItems.map((item) => (
                  <details key={item.question} className="group p-4">
                    <summary className="text-foreground flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                      {item.question}
                      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="text-muted-foreground mt-3 leading-7">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>

              <div className="border-border bg-muted/50 mt-8 rounded-md border p-4">
                <p className="text-foreground font-semibold">
                  Precisa de mais ajuda?
                </p>
                <p className="text-muted-foreground mt-1 leading-7">
                  Confere as{" "}
                  <Link
                    href="/changelog"
                    className="text-primary hover:underline"
                  >
                    novidades
                  </Link>{" "}
                  pra mudanças recentes de comportamento, ou manda feedback pelo
                  app.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    globalThis.window?.openFeedbackModal?.("general")
                  }
                  className="border-border text-foreground hover:bg-background mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
                >
                  <MessageSquareMore className="h-4 w-4" />
                  Mandar feedback
                </button>
              </div>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}
