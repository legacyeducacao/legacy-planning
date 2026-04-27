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
            status="Application error"
            title="This view failed to load"
            description="Something went wrong while rendering the page or loading the data behind it."
            icon={TriangleAlert}
            tone="danger"
            note={
              error.digest
                ? `Reference: ${error.digest}`
                : "Retry the request first. If it repeats, use feedback with the steps that caused it."
            }
            hints={[
              "Try the action again in case the failure was temporary.",
              "Go back to the previous stable page if you were mid-workflow.",
              "Check the changelog if this started right after a recent release.",
            ]}
            actions={
              <>
                <Button onClick={() => reset()}>
                  <RefreshCw className="h-4 w-4" />
                  Try again
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

      <Footer />
    </div>
  )
}
