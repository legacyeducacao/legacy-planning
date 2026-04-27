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
    status: "Authentication required",
    title: "You need to sign in before continuing",
    description:
      "This resource expects an authenticated session before it can be accessed.",
    tone: "warning",
    icon: ShieldAlert,
    hints: [
      "Verify that your session or credential flow has completed successfully.",
      "Start again from a stable route if you were redirected here unexpectedly.",
      "Check whether the upstream service expired your session silently.",
    ],
  },
  "403": {
    code: "403",
    status: "Access forbidden",
    title: "Your current access level can't open this",
    description:
      "The route exists, but the request was blocked by a permission check or policy rule.",
    tone: "warning",
    icon: Ban,
    hints: [
      "Confirm that the account or token being used has the expected permissions.",
      "Go back to a route that doesn't require elevated access.",
      "If this is unexpected, inspect the access policy or environment settings behind the request.",
    ],
  },
  "429": {
    code: "429",
    status: "Too many requests",
    title: "The workflow needs a minute",
    description:
      "The request rate is temporarily above the allowed limit, so the system is asking you to slow down.",
    tone: "warning",
    icon: Clock3,
    hints: [
      "Wait briefly before retrying the same action.",
      "Avoid rapid repeated refreshes or repeated submissions.",
      "If this happens often, reduce polling or request bursts from the client.",
    ],
  },
  "500": {
    code: "500",
    status: "Internal server error",
    title: "The server hit an unexpected fault",
    description:
      "The request reached the backend, but something failed before a successful response could be returned.",
    tone: "danger",
    icon: TriangleAlert,
    hints: [
      "Retry once in case the fault was transient.",
      "Use the changelog and recent changes as the first place to narrow regressions.",
      "Capture the failing action path so it can be reproduced and traced quickly.",
    ],
  },
  "503": {
    code: "503",
    status: "Service unavailable",
    title: "The transcription service is temporarily offline",
    description:
      "A required upstream system is unavailable or still warming back up, so this request cannot complete yet.",
    tone: "danger",
    icon: WifiOff,
    hints: [
      "Wait and retry after the service has had time to recover.",
      "Return to a stable route if you only need browsing or review right now.",
      "If the outage persists, treat it as an infrastructure issue rather than a client-side bug.",
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
                    Back to home
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/documentation">
                    <BookOpen className="h-4 w-4" />
                    Open docs
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
