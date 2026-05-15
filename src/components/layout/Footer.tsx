"use client"

import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-border text-muted-foreground border-t py-6 text-center text-sm">
      <div className="container mx-auto px-4">
        <div className="hidden flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:flex">
          <button
            type="button"
            onClick={() => {
              if (globalThis.window?.openFeedbackModal) {
                globalThis.window.openFeedbackModal("general")
              }
            }}
            className="hover:text-foreground"
          >
            Feedback
          </button>
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
            Termos
          </Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/privacy" className="hover:text-foreground">
            Privacidade
          </Link>
          <span className="hidden sm:inline">·</span>
          <a
            href="https://donate.stripe.com/3cIeVe2e5dHxeEh7BKfUQ0h"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 hover:text-amber-500 dark:text-amber-400"
          >
            Doar
          </a>
        </div>
        <p className="sm:mt-4">
          © {new Date().getFullYear()} LegacyPlanning. Todos os direitos
          reservados.
        </p>
      </div>
    </footer>
  )
}
