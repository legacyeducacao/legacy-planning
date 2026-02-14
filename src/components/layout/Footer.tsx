"use client"

import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (typeof window !== "undefined" && window.openFeedbackModal) {
                window.openFeedbackModal("general")
              }
            }}
            className="hover:text-foreground"
          >
            Feedback
          </a>
          <span className="hidden sm:inline">·</span>
          <a
            href="https://github.com/aramb-dev/transcriptr"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
          <span className="hidden sm:inline">·</span>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <span className="hidden sm:inline">·</span>
          <a
            href="https://donate.stripe.com/3cIeVe2e5dHxeEh7BKfUQ0h"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:text-amber-500 dark:text-amber-400"
          >
            Donate
          </a>
        </div>
        <p className="mt-4">
          © {new Date().getFullYear()} Transcriptr. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
