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
            status="Page not found"
            title="This route doesn't exist"
            description="The page may have moved, the URL may be wrong, or the resource may no longer be available."
            icon={FileSearch}
            tone="info"
            hints={[
              "Check the URL for a typo or missing path segment.",
              "Return to the home page and restart the workflow from a stable route.",
              "Use the docs or changelog if you were trying to reach product guidance.",
            ]}
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
