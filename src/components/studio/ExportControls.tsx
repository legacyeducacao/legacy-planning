"use client"

import React, { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardHeader, CardContent } from "../ui/card"
import { Download, Copy } from "lucide-react"
import { toast } from "sonner"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"
import { formatDuration } from "@/lib/format-utils"
import {
  formatTimeForSRT,
  formatTimeForVTT,
} from "@/lib/export-formats"
import type {
  TranscriptionSegment,
  TranscriptionIntelligence,
} from "@/types/transcription"

export interface ExportControlsProps {
  transcription: string
  segments?: TranscriptionSegment[]
  intelligence?: TranscriptionIntelligence
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  transcription,
  segments,
  intelligence,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<
    "txt" | "docx" | "srt" | "vtt" | "json" | "csv" | "md"
  >("txt")
  const [isDownloading, setIsDownloading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)

  const generateSRT = (): string => {
    if (!segments || segments.length === 0) {
      return "1\n00:00:00,000 --> 00:00:00,100\n" + transcription
    }
    return segments
      .map((segment) => {
        const startTime = formatTimeForSRT(segment.start)
        const endTime = formatTimeForSRT(segment.end)
        const speakerPrefix = segment.speaker
          ? `[Speaker ${segment.speaker}] `
          : ""
        return `${segment.id + 1}\n${startTime} --> ${endTime}\n${speakerPrefix}${segment.text.trim()}\n`
      })
      .join("\n")
  }

  const generateVTT = (): string => {
    if (!segments || segments.length === 0) {
      return "WEBVTT\n\n00:00:00.000 --> 00:00:00.100\n" + transcription
    }
    let vtt = "WEBVTT\n\n"
    vtt += segments
      .map((segment) => {
        const startTime = formatTimeForVTT(segment.start)
        const endTime = formatTimeForVTT(segment.end)
        const speakerPrefix = segment.speaker
          ? `[Speaker ${segment.speaker}] `
          : ""
        return `${startTime} --> ${endTime}\n${speakerPrefix}${segment.text.trim()}\n`
      })
      .join("\n")
    return vtt
  }

  const generateJSON = (): string => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        transcription,
        segments: segments || [],
        intelligence: intelligence || undefined,
        metadata: {
          wordCount: transcription.split(/\s+/).length,
          characterCount: transcription.length,
          segmentCount: segments?.length || 0,
        },
      },
      null,
      2,
    )
  }

  const generateCSV = (): string => {
    if (!segments || segments.length === 0) {
      return (
        'id,start,end,text\n1,0,0,"' + transcription.replace(/"/g, '""') + '"'
      )
    }
    const header = "id,start,end,duration,text"
    const rows = segments.map(
      (seg) =>
        `${seg.id},${seg.start.toFixed(3)},${seg.end.toFixed(3)},${(seg.end - seg.start).toFixed(3)},"${seg.text.replace(/"/g, '""')}"`,
    )
    return [header, ...rows].join("\n")
  }

  const generateMarkdown = (): string => {
    let md = "# Transcription\n\n"
    md += `*Exported: ${new Date().toLocaleString()}*\n\n`
    md += "---\n\n"

    if (intelligence?.summary) {
      md += "## Summary\n\n"
      md += `${intelligence.summary}\n\n`
      md += "---\n\n"
    }

    if (intelligence?.chapters && intelligence.chapters.length > 0) {
      md += "## Chapters\n\n"
      intelligence.chapters.forEach((ch) => {
        md += `### ${ch.headline}\n\n`
        md += `*${formatDuration(ch.start)} - ${formatDuration(ch.end)}*\n\n`
        md += `${ch.summary}\n\n`
      })
      md += "---\n\n"
    }

    if (segments && segments.length > 0) {
      md += "## Transcript\n\n"
      segments.forEach((seg) => {
        const speakerPrefix = seg.speaker ? `**Speaker ${seg.speaker}:** ` : ""
        md += `**[${formatDuration(seg.start)} - ${formatDuration(seg.end)}]** ${speakerPrefix}\n\n`
        md += `${seg.text.trim()}\n\n`
      })
    } else {
      md += "## Full Transcript\n\n"
      md += transcription
    }

    md += "\n---\n\n"
    md += `*Word count: ${transcription.split(/\s+/).length}*\n`
    return md
  }

  const buildDocxChildren = () => {
    const docChildren: Paragraph[] = [
      new Paragraph({
        text: "Transcription",
        heading: HeadingLevel.TITLE,
      }),
      new Paragraph({ children: [new TextRun("")] }),
    ]

    if (intelligence?.summary) {
      docChildren.push(
        new Paragraph({
          text: "Summary",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ children: [new TextRun("")] }),
        ...intelligence.summary
          .split("\n")
          .filter(Boolean)
          .map(
            (line: string) =>
              new Paragraph({
                children: [new TextRun(line.replace(/^[-*\u2022]\s*/, ""))],
              }),
          ),
        new Paragraph({ children: [new TextRun("")] }),
      )
    }

    docChildren.push(
      new Paragraph({
        text: "Transcript",
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({ children: [new TextRun("")] }),
      ...transcription.split("\n").map(
        (line: string) =>
          new Paragraph({
            children: [new TextRun(line)],
          }),
      ),
    )

    return docChildren
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const timestamp = new Date().toISOString().split("T")[0]
      const filename = `transcription_${timestamp}.${selectedFormat}`
      let blob: Blob

      if (selectedFormat === "srt") {
        blob = new Blob([generateSRT()], { type: "text/plain" })
      } else if (selectedFormat === "vtt") {
        blob = new Blob([generateVTT()], { type: "text/vtt" })
      } else if (selectedFormat === "docx") {
        const doc = new Document({
          sections: [{ children: buildDocxChildren() }],
        })
        const buffer = await Packer.toBuffer(doc)
        blob = new Blob([new Uint8Array(buffer)], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })
      } else if (selectedFormat === "json") {
        blob = new Blob([generateJSON()], { type: "application/json" })
      } else if (selectedFormat === "csv") {
        blob = new Blob([generateCSV()], { type: "text/csv" })
      } else if (selectedFormat === "md") {
        blob = new Blob([generateMarkdown()], { type: "text/markdown" })
      } else {
        blob = new Blob([transcription], { type: "text/plain" })
      }

      downloadBlob(blob, filename)
      toast.success(`${selectedFormat.toUpperCase()} file downloaded!`)
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Download failed")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcription)
      setCopySuccess(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true)
    toast.info("Preparing all formats...")

    try {
      const timestamp = new Date().toISOString().split("T")[0]
      const baseDownloads: Array<{ content: Blob; filename: string }> = [
        {
          content: new Blob([transcription], { type: "text/plain" }),
          filename: `transcription_${timestamp}.txt`,
        },
        {
          content: new Blob([generateSRT()], { type: "text/plain" }),
          filename: `transcription_${timestamp}.srt`,
        },
        {
          content: new Blob([generateVTT()], { type: "text/vtt" }),
          filename: `transcription_${timestamp}.vtt`,
        },
        {
          content: new Blob([generateJSON()], { type: "application/json" }),
          filename: `transcription_${timestamp}.json`,
        },
        {
          content: new Blob([generateCSV()], { type: "text/csv" }),
          filename: `transcription_${timestamp}.csv`,
        },
        {
          content: new Blob([generateMarkdown()], { type: "text/markdown" }),
          filename: `transcription_${timestamp}.md`,
        },
      ]

      const doc = new Document({
        sections: [{ children: buildDocxChildren() }],
      })
      const buffer = await Packer.toBuffer(doc)
      const downloads = [
        ...baseDownloads,
        {
          content: new Blob([new Uint8Array(buffer)], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
          filename: `transcription_${timestamp}.docx`,
        },
      ]

      for (let i = 0; i < downloads.length; i++) {
        downloadBlob(downloads[i].content, downloads[i].filename)
        if (i < downloads.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      }

      toast.success(`Downloaded ${downloads.length} files!`)
    } catch (error) {
      console.error("Download all failed:", error)
      toast.error("Failed to download all formats")
    } finally {
      setIsDownloadingAll(false)
    }
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-medium">Export Options</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-gray-600">Format</label>
            <div className="grid grid-cols-4 gap-1">
              {(
                ["txt", "docx", "srt", "vtt", "json", "csv", "md"] as const
              ).map((format) => (
                <Button
                  key={format}
                  variant={selectedFormat === format ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFormat(format)}
                  className="px-2 text-xs"
                >
                  {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-md bg-blue-50 p-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            {selectedFormat === "srt" &&
              "SRT - Subtitle format with timestamps"}
            {selectedFormat === "vtt" && "WebVTT - Web subtitle format"}
            {selectedFormat === "txt" && "Plain text transcription"}
            {selectedFormat === "docx" && "Microsoft Word document"}
            {selectedFormat === "json" && "JSON with full metadata & segments"}
            {selectedFormat === "csv" && "CSV spreadsheet with timestamps"}
            {selectedFormat === "md" && "Markdown with formatted timestamps"}
          </div>

          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full"
            size="sm"
          >
            {isDownloading
              ? "Downloading..."
              : `Download ${selectedFormat.toUpperCase()}`}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button
          onClick={handleCopy}
          disabled={copySuccess}
          className="w-full"
          size="lg"
        >
          {copySuccess ? (
            <>
              <Copy className="mr-2 h-4 w-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleDownloadAll}
          disabled={isDownloadingAll}
          className="w-full text-sm"
          size="sm"
        >
          <Download className="mr-2 h-3 w-3" />
          {isDownloadingAll ? "Downloading..." : "Download All Formats"}
        </Button>
      </div>
    </>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
