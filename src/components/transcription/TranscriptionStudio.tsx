"use client"

import { FileAudio, Keyboard } from "lucide-react"
import React, { useCallback, useRef, useState } from "react"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import type {
  AudioSource,
  TranscriptionIntelligence,
  TranscriptionSegment,
} from "@/types/transcription"
import { AudioPlayer } from "../studio/AudioPlayer"
import { ChaptersPanel } from "../studio/ChaptersPanel"
import { EnhancedTranscript } from "../studio/EnhancedTranscript"
import { EntitiesPanel } from "../studio/EntitiesPanel"
import { ExportControls } from "../studio/ExportControls"
import { FileDetails } from "../studio/FileDetails"
import { KeyboardShortcutsModal } from "../studio/KeyboardShortcutsModal"
import { KeyPhrasesPanel } from "../studio/KeyPhrasesPanel"
import { SentimentPanel } from "../studio/SentimentPanel"
import { SummaryPanel } from "../studio/SummaryPanel"
import { TranscriptStatistics } from "../studio/TranscriptStatistics"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

interface TranscriptionStudioProps {
  transcription: string
  audioSource?: AudioSource
  segments?: TranscriptionSegment[]
  intelligence?: TranscriptionIntelligence
  onNewTranscription: () => void
}

export const TranscriptionStudio: React.FC<TranscriptionStudioProps> = ({
  transcription,
  audioSource,
  segments,
  intelligence,
  onNewTranscription,
}) => {
  const [currentTime, setCurrentTime] = useState(0)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const audioRef = useRef<HTMLVideoElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const audioUrl = audioSource?.url

  const { handleSeek } = useAudioPlayer({
    audioRef,
    searchInputRef,
    transcription,
    onShowShortcuts: () => setShowShortcuts(true),
  })

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  // Build available intelligence tabs
  const intelligenceTabs = React.useMemo(() => {
    if (!intelligence) return []
    const tabs: { value: string; label: string }[] = []
    if (intelligence.chapters && intelligence.chapters.length > 0)
      tabs.push({ value: "chapters", label: "Chapters" })
    if (intelligence.summary) tabs.push({ value: "summary", label: "Summary" })
    if (
      intelligence.sentimentAnalysis &&
      intelligence.sentimentAnalysis.length > 0
    )
      tabs.push({ value: "sentiment", label: "Sentiment" })
    if (intelligence.entities && intelligence.entities.length > 0)
      tabs.push({ value: "entities", label: "Entities" })
    if (intelligence.keyPhrases && intelligence.keyPhrases.length > 0)
      tabs.push({ value: "phrases", label: "Key Phrases" })
    return tabs
  }, [intelligence])

  return (
    <>
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      <div className="min-h-full bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto flex min-h-full flex-col px-4 py-4 lg:py-6">
          {/* Header */}
          <div className="mb-4 flex flex-shrink-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                Transcription Studio
              </h1>
              <p className="text-sm text-gray-600 sm:text-base dark:text-gray-400">
                Professional audio transcription workspace
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="ml-2 hidden text-xs text-gray-400 hover:text-gray-600 lg:inline dark:hover:text-gray-300"
                >
                  • Press{" "}
                  <kbd className="rounded bg-gray-200 px-1 dark:bg-gray-700">
                    ?
                  </kbd>{" "}
                  for shortcuts
                </button>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcuts(true)}
                className="hidden lg:flex"
                title="Keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={onNewTranscription}
                className="flex items-center gap-2"
                size="sm"
              >
                <FileAudio className="h-4 w-4" />
                <span className="hidden sm:inline">New Transcription</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>

          {/* Mobile-first Layout: stacked on mobile, side-by-side on desktop */}
          <div className="flex flex-1 flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-hidden">
            {/* Sidebar: Audio Player + Stats + Export */}
            <div className="order-1 lg:order-2 lg:col-span-1 lg:row-span-1">
              <div className="space-y-4 lg:max-h-full lg:overflow-y-auto">
                <AudioPlayer
                  audioUrl={audioUrl}
                  audioRef={audioRef}
                  onTimeUpdate={handleTimeUpdate}
                  segments={segments}
                />

                <TranscriptStatistics
                  transcription={transcription}
                  segments={segments}
                />

                <div className="hidden lg:block">
                  <FileDetails audioSource={audioSource} />
                </div>

                <ExportControls
                  transcription={transcription}
                  segments={segments}
                  intelligence={intelligence}
                />
              </div>
            </div>

            {/* Transcript + Intelligence Panel */}
            <div className="order-2 flex min-h-[400px] flex-col lg:order-1 lg:col-span-2">
              <Card className="flex flex-1 flex-col">
                <CardContent className="flex-1 overflow-hidden p-4 lg:p-6">
                  {intelligenceTabs.length > 0 ? (
                    <Tabs
                      defaultValue="transcript"
                      className="flex h-full flex-col"
                    >
                      <TabsList className="mb-4 flex-shrink-0 flex-wrap">
                        <TabsTrigger value="transcript">Transcript</TabsTrigger>
                        {intelligenceTabs.map((tab) => (
                          <TabsTrigger key={tab.value} value={tab.value}>
                            {tab.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      <TabsContent
                        value="transcript"
                        className="flex-1 overflow-hidden"
                      >
                        <EnhancedTranscript
                          transcription={transcription}
                          segments={segments}
                          onSegmentClick={handleSeek}
                          currentTime={currentTime}
                          searchInputRef={searchInputRef}
                        />
                      </TabsContent>

                      {intelligence?.chapters &&
                        intelligence.chapters.length > 0 && (
                          <TabsContent
                            value="chapters"
                            className="flex-1 overflow-auto"
                          >
                            <ChaptersPanel
                              chapters={intelligence.chapters}
                              currentTime={currentTime}
                              onSeek={handleSeek}
                            />
                          </TabsContent>
                        )}

                      {intelligence?.summary && (
                        <TabsContent
                          value="summary"
                          className="flex-1 overflow-auto"
                        >
                          <SummaryPanel summary={intelligence.summary} />
                        </TabsContent>
                      )}

                      {intelligence?.sentimentAnalysis &&
                        intelligence.sentimentAnalysis.length > 0 && (
                          <TabsContent
                            value="sentiment"
                            className="flex-1 overflow-auto"
                          >
                            <SentimentPanel
                              sentimentResults={intelligence.sentimentAnalysis}
                              currentTime={currentTime}
                              onSeek={handleSeek}
                            />
                          </TabsContent>
                        )}

                      {intelligence?.entities &&
                        intelligence.entities.length > 0 && (
                          <TabsContent
                            value="entities"
                            className="flex-1 overflow-auto"
                          >
                            <EntitiesPanel
                              entities={intelligence.entities}
                              onSeek={handleSeek}
                            />
                          </TabsContent>
                        )}

                      {intelligence?.keyPhrases &&
                        intelligence.keyPhrases.length > 0 && (
                          <TabsContent
                            value="phrases"
                            className="flex-1 overflow-auto"
                          >
                            <KeyPhrasesPanel
                              keyPhrases={intelligence.keyPhrases}
                              onSeek={handleSeek}
                            />
                          </TabsContent>
                        )}
                    </Tabs>
                  ) : (
                    <EnhancedTranscript
                      transcription={transcription}
                      segments={segments}
                      onSegmentClick={handleSeek}
                      currentTime={currentTime}
                      searchInputRef={searchInputRef}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TranscriptionStudio
