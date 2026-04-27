"use client"

import React, { useEffect } from "react"
import { Button } from "../ui/button"
import { Keyboard, X } from "lucide-react"

export interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { key: "Space", action: "Play / Pause" },
  { key: "\u2190", action: "Skip back 5s" },
  { key: "\u2192", action: "Skip forward 5s" },
  { key: "Shift + \u2190", action: "Skip back 30s" },
  { key: "Shift + \u2192", action: "Skip forward 30s" },
  { key: "\u2191 / \u2193", action: "Volume up / down" },
  { key: "M", action: "Mute / Unmute" },
  { key: "0-9", action: "Jump to 0%-90%" },
  { key: "Ctrl/\u2318 + F", action: "Focus search" },
  { key: "Ctrl/\u2318 + C", action: "Copy transcript" },
  { key: "Esc", action: "Clear search" },
  { key: "?", action: "Show shortcuts" },
]

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    globalThis.addEventListener("keydown", handleKeyDown)
    return () => globalThis.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close keyboard shortcuts"
      />
      <dialog
        open
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
        className="relative mx-4 w-full max-w-md rounded-lg border-0 bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3
            id="keyboard-shortcuts-title"
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white"
          >
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map(({ key, action }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="text-gray-600 dark:text-gray-300">{action}</span>
              <kbd className="rounded bg-gray-200 px-2 py-1 font-mono text-xs dark:bg-gray-700">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </dialog>
    </div>
  )
}
