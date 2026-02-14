import { useEffect, useCallback } from "react"
import { toast } from "sonner"

interface UseAudioPlayerOptions {
  audioRef: React.RefObject<HTMLVideoElement | null>
  searchInputRef: React.RefObject<HTMLInputElement | null>
  transcription: string
  onShowShortcuts: () => void
  onVolumeChange?: (volume: number) => void
  onMuteChange?: (muted: boolean) => void
}

export function useAudioPlayer({
  audioRef,
  searchInputRef,
  transcription,
  onShowShortcuts,
  onVolumeChange,
  onMuteChange,
}: UseAudioPlayerOptions) {
  const handleSeek = useCallback(
    (startTime: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = startTime
        audioRef.current.play().catch((error) => {
          console.error("Audio playback failed:", error)
          toast.error("Failed to play audio")
        })
      }
    },
    [audioRef],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable

      if (e.key === "Escape") {
        if (searchInputRef.current) {
          searchInputRef.current.blur()
          searchInputRef.current.value = ""
        }
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "c" && !isInputField) {
        e.preventDefault()
        navigator.clipboard
          .writeText(transcription)
          .then(() => {
            toast.success("Transcript copied to clipboard!")
          })
          .catch(() => {
            toast.error("Failed to copy transcript")
          })
        return
      }

      if (isInputField) return

      const audio = audioRef.current
      if (!audio) return

      switch (e.key) {
        case " ":
          e.preventDefault()
          if (audio.paused) {
            audio.play().catch(console.error)
          } else {
            audio.pause()
          }
          break

        case "ArrowLeft":
          e.preventDefault()
          audio.currentTime = Math.max(
            0,
            audio.currentTime - (e.shiftKey ? 30 : 5),
          )
          break

        case "ArrowRight":
          e.preventDefault()
          audio.currentTime = Math.min(
            audio.duration || 0,
            audio.currentTime + (e.shiftKey ? 30 : 5),
          )
          break

        case "ArrowUp": {
          e.preventDefault()
          const newVolUp = Math.min(1, audio.volume + 0.1)
          audio.volume = newVolUp
          onVolumeChange?.(newVolUp)
          toast.success(`Volume: ${Math.round(newVolUp * 100)}%`)
          break
        }

        case "ArrowDown": {
          e.preventDefault()
          const newVolDown = Math.max(0, audio.volume - 0.1)
          audio.volume = newVolDown
          onVolumeChange?.(newVolDown)
          toast.success(`Volume: ${Math.round(newVolDown * 100)}%`)
          break
        }

        case "m":
        case "M":
          e.preventDefault()
          audio.muted = !audio.muted
          onMuteChange?.(audio.muted)
          toast.success(audio.muted ? "Muted" : "Unmuted")
          break

        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9": {
          e.preventDefault()
          const percentage = parseInt(e.key) * 10
          if (audio.duration) {
            audio.currentTime = (audio.duration * percentage) / 100
            toast.success(`Jumped to ${percentage}%`)
          }
          break
        }

        case "0":
          e.preventDefault()
          audio.currentTime = 0
          break

        case "?":
          e.preventDefault()
          onShowShortcuts()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [audioRef, searchInputRef, transcription, onShowShortcuts, onVolumeChange, onMuteChange])

  return { handleSeek }
}
