import { AlertTriangle } from "lucide-react"
import React from "react"
import { Input } from "@/components/ui/input"

interface UrlInputProps {
  audioUrl: string
  urlError: string | null
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function UrlInput({ audioUrl, urlError, onUrlChange }: UrlInputProps) {
  return (
    <div className="mt-6 flex flex-col items-center gap-4">
      <div className="w-full space-y-2">
        <label
          htmlFor="audio-url"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          URL do áudio
        </label>
        <Input
          id="audio-url"
          type="url"
          placeholder="https://exemplo.com/audio.mp3"
          value={audioUrl}
          onChange={onUrlChange}
          className={
            urlError ? "border-red-500 focus-visible:ring-red-500" : ""
          }
          aria-describedby={urlError ? "url-error" : undefined}
          aria-invalid={!!urlError}
        />
        {urlError && (
          <p
            id="url-error"
            className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
          >
            <AlertTriangle className="h-3 w-3" /> {urlError}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Cola um link direto pra arquivo MP3, WAV, FLAC ou OGG. O link tem que
          terminar com a extensão do arquivo.
        </p>
      </div>
    </div>
  )
}
