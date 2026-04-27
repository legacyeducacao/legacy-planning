import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx"
import type {
  TranscriptionIntelligence,
  TranscriptionSegment,
} from "@/types/transcription"
import { formatDuration } from "./format-utils"

const splitTimestamp = (seconds: number) => {
  const totalMs = Math.round(seconds * 1000)
  const ms = totalMs % 1000
  const totalSecs = Math.floor(totalMs / 1000)
  return {
    hours: Math.floor(totalSecs / 3600),
    minutes: Math.floor((totalSecs % 3600) / 60),
    secs: totalSecs % 60,
    ms,
  }
}

export const formatTimeForSRT = (seconds: number): string => {
  const { hours, minutes, secs, ms } = splitTimestamp(seconds)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`
}

export const formatTimeForVTT = (seconds: number): string => {
  const { hours, minutes, secs, ms } = splitTimestamp(seconds)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
}

export const generateSRT = (
  transcription: string,
  segments?: TranscriptionSegment[],
): string => {
  if (!segments || segments.length === 0) {
    return "1\n00:00:00,000 --> 00:00:00,100\n" + transcription
  }

  return segments
    .map((segment, index) => {
      const startTime = formatTimeForSRT(segment.start)
      const endTime = formatTimeForSRT(segment.end)
      const speakerPrefix = segment.speaker
        ? `[Speaker ${segment.speaker}] `
        : ""
      return `${index + 1}\n${startTime} --> ${endTime}\n${speakerPrefix}${segment.text.trim()}\n`
    })
    .join("\n")
}

export const generateVTT = (
  transcription: string,
  segments?: TranscriptionSegment[],
): string => {
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

export const generateJSON = (
  transcription: string,
  segments?: TranscriptionSegment[],
  intelligence?: TranscriptionIntelligence,
): string => {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      transcription,
      segments: segments || [],
      intelligence: intelligence || undefined,
      metadata: {
        wordCount: transcription.trim().split(/\s+/).filter(Boolean).length,
        characterCount: transcription.length,
        segmentCount: segments?.length || 0,
      },
    },
    null,
    2,
  )
}

export const generateCSV = (
  transcription: string,
  segments?: TranscriptionSegment[],
): string => {
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

export const generateMarkdown = (
  transcription: string,
  segments?: TranscriptionSegment[],
  intelligence?: TranscriptionIntelligence,
): string => {
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
  md += `*Word count: ${transcription.trim().split(/\s+/).filter(Boolean).length}*\n`
  return md
}

export const generateDOCX = async (
  transcription: string,
  _segments?: TranscriptionSegment[],
  intelligence?: TranscriptionIntelligence,
): Promise<Blob> => {
  const docChildren: Paragraph[] = [
    new Paragraph({
      text: "Transcription",
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({ children: [new TextRun("")] }),
  ]

  if (intelligence?.summary) {
    docChildren.push(
      new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_1 }),
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
    new Paragraph({ text: "Transcript", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ children: [new TextRun("")] }),
    ...transcription.split("\n").map(
      (line: string) =>
        new Paragraph({
          children: [new TextRun(line)],
        }),
    ),
  )

  const doc = new Document({
    sections: [{ children: docChildren }],
  })
  const buffer = await Packer.toBuffer(doc)
  return new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
}
