"use client"

import Link from "next/link"
import {
  ArrowRight,
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
  Sparkles,
  Wrench,
} from "lucide-react"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const guideSections = [
  {
    href: "#quick-start",
    icon: BookOpen,
    title: "Quick start",
    description: "The fastest route from upload to export.",
  },
  {
    href: "#features",
    icon: Sparkles,
    title: "Key features",
    description: "What the current Transcriptr workflow supports.",
  },
  {
    href: "#formats",
    icon: FileAudio,
    title: "Supported formats",
    description: "Audio and video formats that work without conversion.",
  },
  {
    href: "#troubleshooting",
    icon: Wrench,
    title: "Troubleshooting",
    description: "Common issues and the quickest fixes.",
  },
  {
    href: "#faq",
    icon: CircleHelp,
    title: "FAQ",
    description: "Short answers to the questions users ask most.",
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="border-b border-border px-4 py-16 sm:py-20">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  Documentation
                </div>

                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  Everything you need to use Transcriptr&apos;s current workflow
                </h1>

                <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                  Start with uploads and transcription options, then move into
                  Studio playback, exports, troubleshooting, and the questions
                  that come up most often.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link href="/">
                      <FileAudio className="h-4 w-4" />
                      Start Transcribing
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/changelog">
                      View Changelog
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  <Card className="border-border/60">
                    <CardContent className="py-1">
                      <p className="text-2xl font-semibold text-foreground">
                        4
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Core workflow stages from upload to export
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardContent className="py-1">
                      <p className="text-2xl font-semibold text-foreground">
                        25+
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supported media formats across audio and video
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardContent className="py-1">
                      <p className="text-2xl font-semibold text-foreground">
                        1
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Studio workspace for playback, search, and export
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>In this guide</CardTitle>
                  <CardDescription>
                    Jump directly to the section you need.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {guideSections.map((section) => (
                    <Link
                      key={section.href}
                      href={section.href}
                      className="flex items-start gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-muted/40"
                    >
                      <section.icon className="mt-0.5 h-4 w-4 text-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {section.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section
          id="quick-start"
          className="border-b border-border px-4 py-16"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-bold text-foreground">
                Quick start
              </h2>
              <p className="mt-2 text-muted-foreground">
                The shortest path from raw media to a reviewed transcript.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {quickStartSteps.map((step) => (
                <Card key={step.step} className="border-border/60">
                  <CardHeader>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <step.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium tracking-[0.24em] text-muted-foreground">
                        {step.step}
                      </span>
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-border px-4 py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-bold text-foreground">
                Key features
              </h2>
              <p className="mt-2 text-muted-foreground">
                The documentation tracks the product shape reflected in the
                newer pages and the current Studio flow.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border/60">
                  <CardHeader>
                    <feature.icon className="mb-3 h-5 w-5 text-primary" />
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="formats" className="border-b border-border px-4 py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-bold text-foreground">
                Supported formats
              </h2>
              <p className="mt-2 text-muted-foreground">
                Most common media types work natively, so you usually do not
                need an extra conversion step before uploading.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {formatGroups.map((group) => (
                <Card key={group.title} className="border-border/60">
                  <CardHeader>
                    <group.icon className="mb-3 h-5 w-5 text-primary" />
                    <CardTitle>{group.title}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <ChevronRight className="mt-0.5 h-4 w-4 text-primary" />
                          <p className="text-sm text-muted-foreground">{item}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          id="troubleshooting"
          className="border-b border-border px-4 py-16"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-bold text-foreground">
                Troubleshooting
              </h2>
              <p className="mt-2 text-muted-foreground">
                Start with the category closest to the failure mode you are
                seeing.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {troubleshootingTopics.map((topic) => (
                <Card key={topic.title} className="border-border/60">
                  <CardHeader>
                    <topic.icon className="mb-3 h-5 w-5 text-primary" />
                    <CardTitle>{topic.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topic.tips.map((tip) => (
                        <div key={tip} className="flex items-start gap-2">
                          <ChevronRight className="mt-0.5 h-4 w-4 text-primary" />
                          <p className="text-sm text-muted-foreground">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-bold text-foreground">FAQ</h2>
              <p className="mt-2 text-muted-foreground">
                Short answers to the questions that come up most often.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {faqItems.map((item) => (
                <Card key={item.question} className="border-border/60">
                  <CardHeader>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CircleHelp className="h-4 w-4" />
                    </div>
                    <CardTitle>{item.question}</CardTitle>
                    <CardDescription>{item.answer}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <Card className="mt-10 border-border/60">
              <CardContent className="flex flex-col gap-5 py-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Need more help?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Check the changelog for recent behavior changes or send
                    feedback directly from the app.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="outline">
                    <Link href="/changelog">
                      <BookOpen className="h-4 w-4" />
                      View Changelog
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.openFeedbackModal?.("general")}
                  >
                    <MessageSquareMore className="h-4 w-4" />
                    Send Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
