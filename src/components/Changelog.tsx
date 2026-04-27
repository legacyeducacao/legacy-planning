"use client"

import { useState } from "react"
import Link from "next/link"
import { marked } from "marked"
import { Button } from "./ui/button"
import { X, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { changelogItems } from "../data/changelog"

interface ChangelogProps {
  readonly isModal?: boolean
  readonly onClose?: () => void
}

export function Changelog({ isModal = false, onClose }: ChangelogProps) {
  const [expandedVersions, setExpandedVersions] = useState<string[]>(
    // Auto-expand first version
    changelogItems.length > 0 ? [changelogItems[0].version] : [],
  )

  const showHeader = !isModal || !!onClose

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) =>
      prev.includes(version)
        ? prev.filter((v) => v !== version)
        : [...prev, version],
    )
  }

  // Changelog content is from our own data file, not user input — safe for innerHTML
  const parseMarkdown = (markdown: string) => {
    const rawMarkup = marked(markdown, { breaks: true, gfm: true })
    return { __html: rawMarkup as string }
  }

  const renderChanges = (
    changes: string[],
    label: string,
    colorClass: string,
  ) => {
    if (!changes || changes.length === 0) return null
    return (
      <div>
        <h3
          className={`mb-2 text-xs font-semibold tracking-[0.22em] uppercase ${colorClass}`}
        >
          {label}
        </h3>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-primary">
          {changes.map((change) => (
            <li
              key={`${label}-${change.slice(0, 50)}`}
              dangerouslySetInnerHTML={parseMarkdown(change)}
            />
          ))}
        </ul>
      </div>
    )
  }

  const content = (
    <div
      className={`overflow-hidden border border-border bg-card text-card-foreground ${isModal ? "rounded-2xl shadow-xs" : "rounded-2xl shadow-sm"}`}
    >
      <div className="p-4 sm:p-6 lg:p-8">
        {showHeader && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
              Changelog
            </h2>
            {isModal && onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        <div className="space-y-4">
          {changelogItems.map((item) => {
            const isExpanded = expandedVersions.includes(item.version)

            return (
              <div
                key={`${item.version}-${item.date}`}
                className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <button
                  onClick={() => toggleVersion(item.version)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      v{item.version}
                    </span>
                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                      {item.date}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
                        {renderChanges(
                          item.changes.new ?? [],
                          "New",
                          "text-green-600 dark:text-green-400",
                        )}
                        {renderChanges(
                          item.changes.improved ?? [],
                          "Improved",
                          "text-blue-600 dark:text-blue-400",
                        )}
                        {renderChanges(
                          item.changes.fixed ?? [],
                          "Fixed",
                          "text-amber-600 dark:text-amber-400",
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {!isModal && (
        <div className="flex justify-center border-t border-gray-200 p-4 dark:border-gray-700">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              Back to Transcriptr
            </Button>
          </Link>
        </div>
      )}
    </div>
  )

  if (isModal) {
    return content
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-3xl px-4">{content}</div>
    </div>
  )
}
