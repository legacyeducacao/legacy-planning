"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileAudio } from "lucide-react"

export default function StudioRedirectPage() {
  const router = useRouter()

  // Old studio page used ?session= query params
  // Now we use /studio/[id] route params
  // Redirect to home if no specific ID
  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search)
    const session = params.get("session")
    if (session) {
      // Can't directly map old session IDs to prediction IDs
      // Redirect to home
      router.replace("/")
    }
  }, [router])

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
