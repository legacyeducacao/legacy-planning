"use client"

import { useState, useCallback, Suspense } from "react"
import { useRouter } from "next/navigation"
import { UploadAudio } from "@/components/UploadAudio"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Toaster, toast } from "sonner"
import { FeedbackModals } from "@/components/feedback/FeedbackModals"
import { uploadLargeFile } from "@/lib/storage-service"
import { getApiUrl } from "@/services/transcription"
import { getUserFriendlyErrorMessage } from "@/lib/error-utils"
import { useHistoryStore } from "@/stores/history-store"
import type { AIFeatures } from "@/types/transcription"

export default function UploadPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const addToHistory = useHistoryStore((s) => s.add)

  const handleUpload = useCallback(
    async (
      data: FormData | { audioUrl: string },
      options: { language: string; diarize: boolean; aiFeatures: AIFeatures },
    ) => {
      setIsSubmitting(true)

      try {
        const requestBody: {
          options: { language?: string; diarize?: boolean; aiFeatures?: AIFeatures } | null
          audioUrl?: string
        } = { options: null }

        let audioSourceName = "Audio"
        let audioSourceSize: number | undefined
        let audioSourceType: "file" | "url" = "url"
        let audioUrl: string | undefined

        if (data instanceof FormData) {
          const file = data.get("file") as File
          if (!file) throw new Error("No file found")

          audioSourceName = file.name
          audioSourceSize = file.size
          audioSourceType = "file"

          toast.info("Uploading file...")
          const uploadResult = await uploadLargeFile(file)
          requestBody.audioUrl = uploadResult.url
          audioUrl = uploadResult.url
          localStorage.setItem("studioAudioUrl", uploadResult.url)
        } else {
          requestBody.audioUrl = data.audioUrl
          audioUrl = data.audioUrl
          audioSourceName = data.audioUrl
          audioSourceType = "url"
          localStorage.setItem("studioAudioUrl", data.audioUrl)
        }

        requestBody.options = {
          language: options.language,
          diarize: options.diarize || false,
          aiFeatures: options.aiFeatures,
        }

        toast.info("Starting transcription...")

        const response = await fetch(getApiUrl("transcribe"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          let errorBody = "Unknown server error"
          try {
            const errorJson = await response.json()
            errorBody = errorJson.error || errorJson.message || JSON.stringify(errorJson)
          } catch {
            errorBody = `Server error (${response.status})`
          }
          throw new Error(errorBody)
        }

        const resultData = await response.json()

        if (!resultData?.id) {
          throw new Error("Invalid API response: Missing prediction ID")
        }

        if (resultData.audioUrl) {
          localStorage.setItem("studioAudioUrl", resultData.audioUrl)
          audioUrl = resultData.audioUrl
        }

        addToHistory({
          predictionId: resultData.id,
          audioSource: {
            name: audioSourceName,
            size: audioSourceSize,
            type: audioSourceType,
            url: audioUrl,
          },
          options,
          status: "processing",
          createdAt: Date.now(),
        })

        router.push(`/transcribe/${resultData.id}`)
      } catch (err) {
        console.error("Upload failed:", err)
        const errorInfo = getUserFriendlyErrorMessage(err)
        toast.error(errorInfo.userMessage)
        setIsSubmitting(false)
      }
    },
    [router, addToHistory],
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl">
              Transcriptr
            </h1>
            <p className="text-muted-foreground">
              Convert audio to text with AI-powered transcription
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  Preparing your transcription...
                </p>
              </div>
            ) : (
              <UploadAudio onUpload={handleUpload} />
            )}
          </div>
        </div>
      </main>

      <Footer />

      <Suspense fallback={null}>
        <FeedbackModals />
      </Suspense>

      <Toaster />
    </div>
  )
}
