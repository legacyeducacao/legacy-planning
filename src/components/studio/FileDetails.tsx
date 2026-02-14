"use client"

import React from "react"
import { Badge } from "../ui/badge"
import { Card, CardHeader, CardContent } from "../ui/card"
import { FileText, Clock } from "lucide-react"
import { formatDuration, formatFileSize } from "@/lib/format-utils"
import type { AudioSource } from "@/types/transcription"

export interface FileDetailsProps {
  audioSource?: AudioSource
}

export const FileDetails: React.FC<FileDetailsProps> = ({ audioSource }) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-green-600" />
          <h3 className="text-sm font-medium">File Details</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between">
          <span className="text-sm text-gray-600">Filename</span>
          <span className="max-w-[200px] truncate text-right text-sm font-medium">
            {audioSource?.name || "Unknown"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Duration</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-500" />
            <span className="text-sm">
              {formatDuration(audioSource?.duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Size</span>
          <span className="text-sm">
            {formatFileSize(audioSource?.size)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Type</span>
          <Badge variant="secondary" className="text-xs">
            {audioSource?.type === "file" ? "Upload" : "URL"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
