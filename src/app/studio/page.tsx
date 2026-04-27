"use client"

import { FileAudio } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"

function StudioRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Old studio page used ?session= query params; new route is /studio/[id].
  // Redirect to home immediately — can't map old session IDs to prediction IDs.
  if (searchParams.get("session")) {
    router.replace("/")
    return null
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md px-4 text-center">
        <div className="bg-muted mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
          <FileAudio className="text-muted-foreground h-10 w-10" />
        </div>
        <h1 className="text-foreground mb-2 text-2xl font-bold">
          Open Studio from a Transcription
        </h1>
        <p className="text-muted-foreground mb-6">
          Upload and transcribe audio first, then open the result in Studio.
        </p>
        <Button onClick={() => router.push("/")}>
          <FileAudio className="mr-2 h-4 w-4" />
          New Transcription
        </Button>
      </div>
    </div>
  )
}

export default function StudioRedirectPage() {
  return (
    <Suspense>
      <StudioRedirectContent />
    </Suspense>
  )
}
