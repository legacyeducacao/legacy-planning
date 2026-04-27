"use client"

import React, { useEffect, useRef, useState } from "react"

const escapeRegExp = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)

import { Copy, Search } from "lucide-react"
import { toast } from "sonner"
import { formatDuration } from "@/lib/format-utils"
import { getSpeakerColor } from "@/lib/speaker-colors"
import { cn } from "@/lib/utils"
import type {
  TranscriptionSegment,
  TranscriptionWord,
} from "@/types/transcription"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

// Binary search to find active word index
const findActiveWordIndex = (
  words: TranscriptionWord[],
  currentTime: number,
): number => {
  let low = 0
  let high = words.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (currentTime >= words[mid].start && currentTime < words[mid].end) {
      return mid
    } else if (currentTime < words[mid].start) {
      high = mid - 1
    } else {
      low = mid + 1
    }
  }
  return -1
}

export interface EnhancedTranscriptProps {
  transcription: string
  segments?: TranscriptionSegment[]
  onSegmentClick?: (startTime: number) => void
  searchInputRef?: React.RefObject<HTMLInputElement | null>
  currentTime?: number
}

export const EnhancedTranscript: React.FC<EnhancedTranscriptProps> = ({
  transcription,
  segments,
  onSegmentClick,
  currentTime = 0,
  searchInputRef,
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [copySuccess, setCopySuccess] = useState(false)
  const activeSegmentRef = useRef<HTMLButtonElement>(null)
  const prevSegmentIndexRef = useRef<number | null>(null)

  const handleCopyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcription)
      setCopySuccess(true)
      toast.success("Transcript copied to clipboard!")
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      toast.error("Failed to copy transcript")
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.trim() && segments) {
      const results: number[] = []
      segments.forEach((segment, index) => {
        if (segment.text.toLowerCase().includes(term.toLowerCase())) {
          results.push(index)
        }
      })
      setSearchResults(results)
    } else if (term.trim() && !segments && transcription) {
      const matches = transcription.match(
        new RegExp(escapeRegExp(term), "gi"),
      )
      setSearchResults(
        matches ? Array.from({ length: matches.length }, (_, i) => i) : [],
      )
    } else {
      setSearchResults([])
    }
  }

  const currentSegmentIndex = segments
    ? segments.findIndex(
        (seg) => currentTime >= seg.start && currentTime < seg.end,
      )
    : -1

  // Auto-scroll to active segment when it changes
  useEffect(() => {
    if (
      currentSegmentIndex >= 0 &&
      currentSegmentIndex !== prevSegmentIndexRef.current
    ) {
      prevSegmentIndexRef.current = currentSegmentIndex
      activeSegmentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [currentSegmentIndex])

  const renderKaraokeWords = (words: TranscriptionWord[]) => {
    const activeWordIdx = findActiveWordIndex(words, currentTime)

    return words.map((word, idx) => {
      const isActive = idx === activeWordIdx
      const isPast = currentTime >= word.end
      const isInactivePast = isPast && isActive === false

      return (
        <span
          key={`${word.word}-${word.start}-${idx}`}
          className={cn(
            "transition-colors duration-100",
            isActive &&
              "rounded bg-blue-200 px-0.5 font-bold text-blue-900 dark:bg-blue-700 dark:text-blue-100",
            isInactivePast && "text-gray-400 dark:text-gray-500",
          )}
        >
          {word.word}{" "}
        </span>
      )
    })
  }

  const renderSegmentText = (
    segment: TranscriptionSegment,
    isCurrentSegment: boolean,
    isHighlighted: boolean,
  ) => {
    if (isCurrentSegment && segment.words && segment.words.length > 0) {
      return renderKaraokeWords(segment.words)
    }

    if (searchTerm && isHighlighted) {
      return segment.text
        .split(new RegExp(`(${escapeRegExp(searchTerm)})`, "gi"))
        .map((part, partIndex) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark
              key={`part-${partIndex}-${part}`}
              className="rounded bg-yellow-200 px-1"
            >
              {part}
            </mark>
          ) : (
            part
          ),
        )
    }

    return segment.text
  }

  const getSegmentClassName = (
    isCurrentSegment: boolean,
    isHighlighted: boolean,
  ) => {
    if (isCurrentSegment) {
      return "border-blue-400 bg-blue-50 shadow-md dark:border-blue-600 dark:bg-blue-900/20"
    }

    if (isHighlighted) {
      return "border-yellow-200 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20"
    }

    return "border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
  }

  return (
    <div className="space-y-4">
      {/* Search Bar + Copy */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            ref={searchInputRef}
            placeholder="Search transcript... (Ctrl+F)"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyTranscript}
          disabled={copySuccess}
          className="flex-shrink-0"
        >
          {copySuccess ? (
            <>
              <Copy className="h-4 w-4 text-green-500" />
              <span className="ml-1">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span className="ml-1">Copy All</span>
            </>
          )}
        </Button>
      </div>

      {searchResults.length > 0 && (
        <p className="text-xs text-gray-500">
          Found {searchResults.length} result
          {searchResults.length === 1 ? "" : "s"}
        </p>
      )}

      {/* Segments View */}
      {segments && segments.length > 0 ? (
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="space-y-2 pr-2">
            {segments.map((segment, index) => {
              const isHighlighted = searchResults.includes(index)
              const isCurrentSegment = currentSegmentIndex === index
              const speakerColor = segment.speaker
                ? getSpeakerColor(segment.speaker)
                : null

              return (
                <button
                  type="button"
                  key={segment.id}
                  ref={isCurrentSegment ? activeSegmentRef : undefined}
                  onClick={() => onSegmentClick?.(segment.start)}
                  className={cn(
                    "w-full cursor-pointer rounded-lg border p-3 text-left transition-all duration-200 hover:shadow-md",
                    speakerColor && `border-l-4 ${speakerColor.border}`,
                    getSegmentClassName(isCurrentSegment, isHighlighted),
                  )}
                  title="Click to play audio from this segment"
                >
                  {/* Timestamp + Speaker Badge */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-gray-200 px-2 py-1 font-mono text-xs dark:bg-gray-700">
                      {formatDuration(segment.start)} -{" "}
                      {formatDuration(segment.end)}
                    </span>
                    {segment.speaker && speakerColor && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          speakerColor.badge,
                        )}
                      >
                        Speaker {segment.speaker}
                      </span>
                    )}
                    {isCurrentSegment && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Now Playing
                      </span>
                    )}
                  </div>

                  {/* Transcript Text — karaoke for active segment */}
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {renderSegmentText(
                      segment,
                      isCurrentSegment,
                      isHighlighted,
                    )}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        // Fallback: full transcript with optional search highlight
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="max-h-96 overflow-y-auto p-6">
            <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {searchTerm && transcription
                ? transcription
                    .split(new RegExp(`(${escapeRegExp(searchTerm)})`, "gi"))
                    .map((part, i) =>
                      part.toLowerCase() === searchTerm.toLowerCase() ? (
                        // biome-ignore lint/suspicious/noArrayIndexKey: split parts have no stable identity
                        <mark key={i} className="rounded bg-yellow-200 px-1">
                          {part}
                        </mark>
                      ) : (
                        part
                      ),
                    )
                : (transcription || "No transcript available")}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
