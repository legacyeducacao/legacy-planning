"use client"

import Link from "next/link"
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
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

const guideSections = [
  {
    href: "#quick-start",
    title: "Quick start",
  },
  {
    href: "#features",
    title: "Features",
  },
  {
    href: "#formats",
    title: "Supported formats",
  },
  {
    href: "#troubleshooting",
    title: "Troubleshooting",
  },
  {
    href: "#faq",
    title: "FAQ",
  },
]

const quickStartSteps = [
  {
    step: "01",
    icon: FileAudio,
    title: "Upload audio",
    description:
      "Drag in a file or paste a direct audio URL to start a new transcription.",
  },
  {
    step: "02",
    icon: Settings2,
    title: "Choose options",
    description:
      "Set language, speaker labels, and optional AI analysis before submitting.",
  },
  {
    step: "03",
    icon: Clock3,
    title: "Track progress",
    description:
      "Monitor the job while it queues and processes, then reopen it from History if needed.",
  },
  {
    step: "04",
    icon: Download,
    title: "Review and export",
    description:
      "Use the Studio to play back audio, scan the transcript, and export the result.",
  },
]

const features = [
  {
    icon: Languages,
    title: "Multi-language transcription",
    description:
      "Work across a wide range of languages with either explicit selection or automatic detection.",
  },
  {
    icon: Brain,
    title: "AI analysis",
    description:
      "Generate summaries, chapters, sentiment, entities, key phrases, and topic labels when enabled.",
  },
  {
    icon: History,
    title: "History and recovery",
    description:
      "Completed and in-progress jobs can be reopened through the app without rebuilding your workflow from scratch.",
  },
  {
    icon: Download,
    title: "Multiple export formats",
    description:
      "Download transcripts in plain text and document-friendly formats after review.",
  },
  {
    icon: Globe2,
    title: "Audio and video input",
    description:
      "Use direct file uploads or supported media URLs depending on how your source material is hosted.",
  },
  {
    icon: ShieldCheck,
    title: "Temporary processing pipeline",
    description:
      "Uploaded media is handled for transcription and not intended to be kept as permanent storage.",
  },
]

const formatGroups = [
  {
    icon: FileAudio,
    title: "Audio formats",
    description:
      "Common voice notes, podcast masters, and archival audio formats work directly.",
    items: [
      "MP3, WAV, and FLAC",
      "OGG, OPUS, and WebM audio",
      "M4A, AAC, and AIFF",
      "WMA, CAF, and other supported variants",
    ],
  },
  {
    icon: FileVideo,
    title: "Video formats",
    description:
      "Transcriptr can extract audio from supported video containers before transcription.",
    items: [
      "MP4 and MOV",
      "AVI and MKV",
      "WMV, FLV, and M4V",
      "Other standard containers supported by the transcription backend",
    ],
  },
]

const troubleshootingTopics = [
  {
    icon: FileAudio,
    title: "Upload issues",
    tips: [
      "Confirm the file or URL points to a supported audio or video format.",
      "Try refreshing the page if an upload stalls before submission.",
      "Check that your connection is stable for larger uploads.",
      "If a source URL fails, verify it is directly reachable and not gated behind auth.",
    ],
  },
  {
    icon: Brain,
    title: "Transcription failures",
    tips: [
      "Clearer speech and cleaner source audio usually improve completion rates.",
      "If advanced analysis is enabled, try a simpler run to isolate the failure.",
      "Retry the job after a short pause if the provider reports a temporary issue.",
      "Use the feedback form for persistent failures tied to one file or workflow.",
    ],
  },
  {
    icon: Globe2,
    title: "Browser compatibility",
    tips: [
      "Use a current version of Chrome, Firefox, Safari, or Edge.",
      "Keep JavaScript enabled for uploads, polling, and studio playback.",
      "Clear cached site data if a stale UI state persists after a deployment.",
      "Disable extensions that block uploads or media playback when debugging.",
    ],
  },
  {
    icon: Clock3,
    title: "Performance tips",
    tips: [
      "Shorter recordings typically finish faster and are easier to review.",
      "Split very long recordings if you need quicker turnaround.",
      "Close heavy browser tabs when working with larger transcripts.",
      "Use History to reopen finished work instead of rerunning the same job.",
    ],
  },
]

const faqItems = [
  {
    question: "What audio formats can I upload?",
    answer:
      "Most common audio and video formats are supported directly, including MP3, WAV, FLAC, OGG, M4A, AAC, MP4, MOV, and more.",
  },
  {
    question: "Is my audio data secure?",
    answer:
      "Audio is processed for transcription and temporary storage, not treated as long-term media hosting.",
  },
  {
    question: "What is the maximum file size?",
    answer:
      "File size limits depend on the current product constraints and hosting setup. If a file fails, split it or reduce its size before retrying.",
  },
  {
    question: "How accurate are the transcriptions?",
    answer:
      "Accuracy depends heavily on audio quality, speaker overlap, language choice, and background noise. Clear recordings perform best.",
  },
  {
    question: "Can I edit transcriptions after they are generated?",
    answer:
      "You can review, copy, and export transcripts today. Built-in editing is still more limited than a dedicated document editor.",
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
                Transcriptr documentation
              </p>
              <h1 className="text-foreground text-3xl font-bold tracking-normal sm:text-4xl">
                Using Transcriptr
              </h1>
              <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
                A practical reference for uploading media, choosing
                transcription options, reviewing results in Studio, exporting
                transcripts, and resolving common issues.
              </p>
            </header>

            <section id="quick-start" className="border-border border-b py-10">
              <div className="mb-6 flex items-center gap-3">
                <FileAudio className="text-primary h-5 w-5" />
                <h2 className="text-foreground text-2xl font-semibold">
                  Quick start
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
                  Features
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
                  Supported formats
                </h2>
              </div>
              <p className="text-muted-foreground mb-6 leading-7">
                Most common media types work without an extra conversion step.
                If a file fails, try exporting it as MP3, WAV, MP4, or MOV.
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
                  Troubleshooting
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
                <p className="text-foreground font-semibold">Need more help?</p>
                <p className="text-muted-foreground mt-1 leading-7">
                  Check the{" "}
                  <Link
                    href="/changelog"
                    className="text-primary hover:underline"
                  >
                    changelog
                  </Link>{" "}
                  for recent behavior changes, or send feedback from the app.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    globalThis.window?.openFeedbackModal?.("general")
                  }
                  className="border-border text-foreground hover:bg-background mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
                >
                  <MessageSquareMore className="h-4 w-4" />
                  Send feedback
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
