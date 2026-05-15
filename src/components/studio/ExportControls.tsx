"use client"

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx"
import { Copy, Download, FileText, Sparkles } from "lucide-react"
import React, { useState } from "react"
import { toast } from "sonner"
import {
  generateCSV,
  generateJSON,
  generateMarkdown,
  generateSRT,
  generateVTT,
} from "@/lib/export-formats"
import type {
  TranscriptionIntelligence,
  TranscriptionSegment,
} from "@/types/transcription"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader } from "../ui/card"

export interface ExportControlsProps {
  transcription: string
  segments?: TranscriptionSegment[]
  intelligence?: TranscriptionIntelligence
  onShowAta?: () => void
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  transcription,
  segments,
  intelligence,
  onShowAta,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<
    "txt" | "docx" | "srt" | "vtt" | "json" | "csv" | "md"
  >("txt")
  const [isDownloading, setIsDownloading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)

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
        blob = new Blob([generateSRT(transcription, segments)], {
          type: "text/plain",
        })
      } else if (selectedFormat === "vtt") {
        blob = new Blob([generateVTT(transcription, segments)], {
          type: "text/vtt",
        })
      } else if (selectedFormat === "docx") {
        const doc = new Document({
          sections: [{ children: buildDocxChildren() }],
        })
        const buffer = await Packer.toBuffer(doc)
        blob = new Blob([new Uint8Array(buffer)], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })
      } else if (selectedFormat === "json") {
        blob = new Blob([generateJSON(transcription, segments, intelligence)], {
          type: "application/json",
        })
      } else if (selectedFormat === "csv") {
        blob = new Blob([generateCSV(transcription, segments)], {
          type: "text/csv",
        })
      } else if (selectedFormat === "md") {
        blob = new Blob(
          [generateMarkdown(transcription, segments, intelligence)],
          { type: "text/markdown" },
        )
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
          content: new Blob([generateSRT(transcription, segments)], {
            type: "text/plain",
          }),
          filename: `transcription_${timestamp}.srt`,
        },
        {
          content: new Blob([generateVTT(transcription, segments)], {
            type: "text/vtt",
          }),
          filename: `transcription_${timestamp}.vtt`,
        },
        {
          content: new Blob(
            [generateJSON(transcription, segments, intelligence)],
            { type: "application/json" },
          ),
          filename: `transcription_${timestamp}.json`,
        },
        {
          content: new Blob([generateCSV(transcription, segments)], {
            type: "text/csv",
          }),
          filename: `transcription_${timestamp}.csv`,
        },
        {
          content: new Blob(
            [generateMarkdown(transcription, segments, intelligence)],
            { type: "text/markdown" },
          ),
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
      {onShowAta && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="text-foreground h-4 w-4" />
              <h3 className="text-sm font-medium">Ata da Reunião</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-xs">
              Estruture a transcrição em uma ata profissional com pauta,
              decisões e encaminhamentos.
            </p>
            <Button onClick={onShowAta} className="w-full gap-2" size="sm">
              <Sparkles className="h-4 w-4" />
              Abrir ata
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-medium">Export Options</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p id="format-label" className="mb-2 text-xs text-gray-600">
              Format
            </p>
            <div
              role="group"
              aria-labelledby="format-label"
              className="grid grid-cols-4 gap-1"
            >
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
