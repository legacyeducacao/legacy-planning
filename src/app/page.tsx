"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { UploadAudio } from "@/components/UploadAudio"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Toaster, toast } from "sonner"
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
          options: {
            language?: string
            diarize?: boolean
            aiFeatures?: AIFeatures
          } | null
          audioUrl?: string
        } = { options: null }

        let audioSourceName: string
        let audioSourceSize: number | undefined
        let audioSourceType: "file" | "url"
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
          // audioUrl held in memory; written to localStorage below once we have the prediction ID
        } else {
          requestBody.audioUrl = data.audioUrl
          audioUrl = data.audioUrl
          audioSourceName = data.audioUrl
          audioSourceType = "url"
          // audioUrl held in memory; written to localStorage below once we have the prediction ID
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
            errorBody =
              errorJson.error || errorJson.message || JSON.stringify(errorJson)
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
          audioUrl = resultData.audioUrl
        }
        if (audioUrl) {
          localStorage.setItem(`audioUrl_${resultData.id}`, audioUrl)
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
    <div className="bg-background flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-foreground mb-2 text-3xl font-bold sm:text-4xl">
              Transcriptr
            </h1>
            <p className="text-muted-foreground">
              Convert audio to text with AI-powered transcription
            </p>
          </div>

          <div className="border-border/50 bg-card rounded-xl border p-6 shadow-sm sm:p-8">
            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="border-primary mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                <p className="text-muted-foreground text-sm">
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

      <Toaster />
    </div>
  )
}
