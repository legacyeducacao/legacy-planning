"use client"

import React from "react"
import { Card, CardHeader, CardContent } from "../ui/card"
import { BarChart3 } from "lucide-react"
import type { TranscriptionSegment } from "@/types/transcription"

export interface TranscriptStatisticsProps {
  transcription: string
  segments?: TranscriptionSegment[]
}

export const TranscriptStatistics: React.FC<TranscriptStatisticsProps> = ({
  transcription,
  segments,
}) => {
  const stats = React.useMemo(() => {
    const words = transcription
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0)
    const characters = transcription.length
    const sentences = transcription
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0).length
    const avgWordLength =
      words.length > 0
        ? (
            words.reduce((sum, w) => sum + w.length, 0) / words.length
          ).toFixed(1)
        : "0"
    const totalDuration =
      segments && segments.length > 0
        ? segments[segments.length - 1].end - segments[0].start
        : 0
    const wordsPerMinute =
      totalDuration > 0
        ? Math.round(words.length / (totalDuration / 60))
        : 0

    // Find most common words (excluding short words)
    const wordFreq: Record<string, number> = {}
    words.forEach((w) => {
      const word = w.toLowerCase().replace(/[^a-z]/g, "")
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1
      }
    })
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      words: words.length,
      characters,
      sentences,
      avgWordLength,
      totalDuration,
      wordsPerMinute,
      topWords,
    }
  }, [transcription, segments])

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-medium">Statistics</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
            <div className="text-lg font-bold text-blue-600">
              {stats.words.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Words</div>
          </div>
          <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
            <div className="text-lg font-bold text-green-600">
              {stats.characters.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Characters</div>
          </div>
          <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
            <div className="text-lg font-bold text-purple-600">
              {stats.sentences}
            </div>
            <div className="text-xs text-gray-500">Sentences</div>
          </div>
          <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
            <div className="text-lg font-bold text-orange-600">
              {stats.wordsPerMinute}
            </div>
            <div className="text-xs text-gray-500">Words/min</div>
          </div>
        </div>
        {stats.topWords.length > 0 && (
          <div className="border-t pt-2">
            <div className="mb-1 text-xs text-gray-500">Top Words</div>
            <div className="flex flex-wrap gap-1">
              {stats.topWords.map(([word, count]) => (
                <span
                  key={word}
                  className="rounded bg-blue-100 px-2 py-0.5 text-xs dark:bg-blue-900"
                >
                  {word} ({count})
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
