import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import {
  FileAudio,
  Languages,
  Brain,
  Download,
  Zap,
  Users,
} from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description:
      "Auto chapters, summarization, sentiment analysis, entity detection, and key phrase extraction.",
  },
  {
    icon: Languages,
    title: "30+ Languages",
    description:
      "Support for English, Spanish, French, German, Arabic, Chinese, Japanese, and many more.",
  },
  {
    icon: Download,
    title: "Multiple Export Formats",
    description:
      "Export as TXT, DOCX, SRT, VTT, JSON, CSV, or Markdown with full timestamps.",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description:
      "Powered by AssemblyAI with state-of-the-art speech recognition models.",
  },
  {
    icon: Users,
    title: "Speaker Diarization",
    description:
      "Identify and label different speakers in conversations, interviews, and meetings.",
  },
  {
    icon: FileAudio,
    title: "Studio Workspace",
    description:
      "Full studio experience with audio playback, karaoke highlighting, and keyboard shortcuts.",
  },
]

const steps = [
  { step: "1", title: "Upload", description: "Drop a file or paste an audio URL" },
  { step: "2", title: "Transcribe", description: "AI processes your audio in minutes" },
  { step: "3", title: "Explore", description: "View, search, export, and analyze" },
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
              Audio to Text,{" "}
              <span className="text-primary">Powered by AI</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Transcriptr converts your audio files into accurate, searchable text
              with AI-powered transcription, speaker identification, and intelligent analysis.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <FileAudio className="h-4 w-4" />
              Start Transcribing
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-2xl font-bold text-foreground">
              Features
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-xl border border-border bg-card p-6">
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

        {/* How it works */}
        <section className="border-t border-border px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-2xl font-bold text-foreground">
              How It Works
            </h2>
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
              {steps.map((s, i) => (
                <div key={s.step} className="flex items-center gap-4 sm:flex-col sm:text-center">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
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
              Ready to get started?
            </h2>
            <p className="mb-6 text-muted-foreground">
              Free to use. No account required.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start Transcribing
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
