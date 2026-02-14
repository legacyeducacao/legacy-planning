"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardHeader, CardContent } from "../ui/card"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  FileAudio,
  Repeat,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/format-utils"
import type { TranscriptionSegment } from "@/types/transcription"

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

export interface AudioPlayerProps {
  audioUrl?: string
  audioRef?: React.RefObject<HTMLVideoElement | null>
  onTimeUpdate?: (time: number) => void
  segments?: TranscriptionSegment[]
  onSegmentChange?: (segmentIndex: number) => void
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  audioRef: externalAudioRef,
  onTimeUpdate,
  segments,
  onSegmentChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isLooping, setIsLooping] = useState(false)
  const [loopStart, setLoopStart] = useState<number | null>(null)
  const [loopEnd, setLoopEnd] = useState<number | null>(null)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const internalAudioRef = useRef<HTMLVideoElement>(null)
  const audioRef = externalAudioRef || internalAudioRef

  const currentSegmentIndex =
    segments?.findIndex(
      (seg) => currentTime >= seg.start && currentTime < seg.end,
    ) ?? -1

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
    setShowSpeedMenu(false)
    toast.success(`Playback speed: ${speed}x`)
  }

  const goToPrevSegment = () => {
    if (!segments || segments.length === 0) return
    const prevIndex = Math.max(0, currentSegmentIndex - 1)
    if (audioRef.current && segments[prevIndex]) {
      audioRef.current.currentTime = segments[prevIndex].start
      onSegmentChange?.(prevIndex)
    }
  }

  const goToNextSegment = () => {
    if (!segments || segments.length === 0) return
    const nextIndex = Math.min(segments.length - 1, currentSegmentIndex + 1)
    if (audioRef.current && segments[nextIndex]) {
      audioRef.current.currentTime = segments[nextIndex].start
      onSegmentChange?.(nextIndex)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const setLoopPoint = (type: "start" | "end") => {
    if (type === "start") {
      setLoopStart(currentTime)
      toast.success(`Loop start: ${formatDuration(currentTime)}`)
    } else {
      setLoopEnd(currentTime)
      toast.success(`Loop end: ${formatDuration(currentTime)}`)
    }
  }

  const clearLoop = () => {
    setLoopStart(null)
    setLoopEnd(null)
    setIsLooping(false)
    toast.success("Loop cleared")
  }

  useEffect(() => {
    if (
      isLooping &&
      loopStart !== null &&
      loopEnd !== null &&
      audioRef.current
    ) {
      if (currentTime >= loopEnd) {
        audioRef.current.currentTime = loopStart
      }
    }
  }, [currentTime, isLooping, loopStart, loopEnd, audioRef])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Audio playback failed:", error)
          toast.error("Failed to play audio")
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(duration, audioRef.current.currentTime + seconds),
      )
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime
      setCurrentTime(time)
      onTimeUpdate?.(time)
    }
  }

  const handleDurationChange = () => {
    if (audioRef.current && audioRef.current.duration) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget
    const clickX = e.clientX - progressBar.getBoundingClientRect().left
    const percentage = clickX / progressBar.clientWidth
    const newTime = percentage * duration

    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, newTime))
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileAudio className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-medium">Audio Player</h3>
        </div>
      </CardHeader>
      <CardContent>
        {audioUrl ? (
          <>
            <video
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleDurationChange}
              onEnded={() => setIsPlaying(false)}
              preload="metadata"
              crossOrigin="anonymous"
              className="hidden"
            />

            <div className="space-y-4">
              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(-10)}
                  className="h-8 w-8 p-0"
                  title="Skip back 10 seconds"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  onClick={togglePlay}
                  size="sm"
                  className="h-10 w-10 rounded-full p-0"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(10)}
                  className="h-8 w-8 p-0"
                  title="Skip forward 10 seconds"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
                <div
                  className="h-1 cursor-pointer overflow-hidden rounded-full bg-gray-200 transition-all duration-100 hover:h-2"
                  onClick={handleProgressBarClick}
                  role="slider"
                  aria-label="Audio progress"
                  aria-valuemin={0}
                  aria-valuemax={duration || 0}
                  aria-valuenow={currentTime}
                >
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-100"
                    style={{
                      width:
                        duration && duration > 0
                          ? `${(currentTime / duration) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Volume & Speed Controls */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="h-8 w-8 p-0"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="h-1 w-20"
                    aria-label="Volume control"
                  />
                </div>

                {/* Playback Speed */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="h-8 px-2 text-xs"
                  >
                    {playbackSpeed}x
                  </Button>
                  {showSpeedMenu && (
                    <div className="absolute right-0 bottom-10 z-10 rounded-md border bg-white p-1 shadow-lg dark:bg-gray-800">
                      {PLAYBACK_SPEEDS.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={cn(
                            "block w-full rounded px-3 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700",
                            playbackSpeed === speed &&
                              "bg-blue-100 dark:bg-blue-900",
                          )}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Loop Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant={isLooping ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      if (loopStart !== null && loopEnd !== null) {
                        setIsLooping(!isLooping)
                      } else {
                        toast.error("Set loop start and end points first")
                      }
                    }}
                    className="h-8 w-8 p-0"
                    title="Toggle loop"
                  >
                    <Repeat className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Segment Navigation */}
              {segments && segments.length > 0 && (
                <div className="flex items-center justify-between border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPrevSegment}
                    disabled={currentSegmentIndex <= 0}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <span className="text-xs text-gray-500">
                    Segment {currentSegmentIndex + 1} of {segments.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNextSegment}
                    disabled={currentSegmentIndex >= segments.length - 1}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Loop Points Display */}
              {(loopStart !== null || loopEnd !== null) && (
                <div className="flex items-center justify-between border-t pt-3 text-xs">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLoopPoint("start")}
                      className="h-6 px-2 text-xs"
                    >
                      A: {loopStart !== null ? formatDuration(loopStart) : "--:--"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLoopPoint("end")}
                      className="h-6 px-2 text-xs"
                    >
                      B: {loopEnd !== null ? formatDuration(loopEnd) : "--:--"}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearLoop}
                    className="h-6 px-2 text-xs text-red-500"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <FileAudio className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No audio file available for playback</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
