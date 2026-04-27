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

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  )
}

function clearSearchInput(input: HTMLInputElement | null) {
  if (!input) return

  input.blur()
  input.value = ""
}

function copyTranscript(transcription: string) {
  navigator.clipboard
    .writeText(transcription)
    .then(() => {
      toast.success("Transcript copied to clipboard!")
    })
    .catch(() => {
      toast.error("Failed to copy transcript")
    })
}

function togglePlayback(audio: HTMLVideoElement) {
  if (audio.paused) {
    audio.play().catch(console.error)
    return
  }

  audio.pause()
}

function adjustVolume(
  audio: HTMLVideoElement,
  amount: number,
  onVolumeChange?: (volume: number) => void,
) {
  const nextVolume = Math.max(0, Math.min(1, audio.volume + amount))
  audio.volume = nextVolume
  onVolumeChange?.(nextVolume)
  toast.success(`Volume: ${Math.round(nextVolume * 100)}%`)
}

function jumpToPercentage(audio: HTMLVideoElement, key: string) {
  const percentage = Number.parseInt(key, 10) * 10
  if (!audio.duration) return

  audio.currentTime = (audio.duration * percentage) / 100
  toast.success(`Jumped to ${percentage}%`)
}

function handleAudioShortcut(
  e: KeyboardEvent,
  audio: HTMLVideoElement,
  onVolumeChange?: (volume: number) => void,
  onMuteChange?: (muted: boolean) => void,
) {
  switch (e.key) {
    case " ":
      e.preventDefault()
      togglePlayback(audio)
      break

    case "ArrowLeft":
      e.preventDefault()
      audio.currentTime = Math.max(0, audio.currentTime - (e.shiftKey ? 30 : 5))
      break

    case "ArrowRight":
      e.preventDefault()
      audio.currentTime = Math.min(
        audio.duration || 0,
        audio.currentTime + (e.shiftKey ? 30 : 5),
      )
      break

    case "ArrowUp":
      e.preventDefault()
      adjustVolume(audio, 0.1, onVolumeChange)
      break

    case "ArrowDown":
      e.preventDefault()
      adjustVolume(audio, -0.1, onVolumeChange)
      break

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
    case "9":
      e.preventDefault()
      jumpToPercentage(audio, e.key)
      break

    case "0":
      e.preventDefault()
      audio.currentTime = 0
      break
  }
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
      const isInputField = isEditableTarget(e.target)

      if (e.key === "Escape") {
        clearSearchInput(searchInputRef.current)
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "c" && !isInputField) {
        e.preventDefault()
        copyTranscript(transcription)
        return
      }

      if (e.key === "?" || (e.code === "Slash" && e.shiftKey)) {
        e.preventDefault()
        onShowShortcuts()
        return
      }

      if (isInputField) return

      const audio = audioRef.current
      if (!audio) return

      handleAudioShortcut(e, audio, onVolumeChange, onMuteChange)
    }

    globalThis.addEventListener("keydown", handleKeyDown)
    return () => globalThis.removeEventListener("keydown", handleKeyDown)
  }, [
    audioRef,
    searchInputRef,
    transcription,
    onShowShortcuts,
    onVolumeChange,
    onMuteChange,
  ])

  return { handleSeek }
}
