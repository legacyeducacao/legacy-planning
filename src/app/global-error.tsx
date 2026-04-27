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
    <html lang="en">
      <body style={{ minHeight: "100vh" }} className="bg-background font-sans">
        <main className="flex min-h-screen items-center px-4 py-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <div className="px-1">
              <Link
                href="/"
                className="text-foreground text-lg font-semibold tracking-tight"
              >
                Transcriptr
              </Link>
            </div>

            <ErrorState
              code="500"
              status="Global application error"
              title="The app hit a critical failure"
              description="A root-level error interrupted the application shell before the current view could recover normally."
              icon={TriangleAlert}
              tone="danger"
              note={
                error.digest
                  ? `Reference: ${error.digest}`
                  : "Use the recovery actions below to reset the app shell or return to a stable route."
              }
              hints={[
                "Use reset first to re-initialize the current app shell.",
                "Return home if the active route is no longer recoverable.",
                "Open the docs if you need a stable route while debugging.",
              ]}
              actions={
                <>
                  <Button onClick={reset}>
                    <RefreshCw className="h-4 w-4" />
                    Reset app
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">
                      <Home className="h-4 w-4" />
                      Go home
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
      </body>
    </html>
  )
}
