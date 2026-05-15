import Link from "next/link"
import { FeedbackForm } from "./FeedbackForm"

export function Feedback() {
  return (
    <div className="bg-background text-foreground min-h-screen py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8">
          <Link
            href="/"
            className="text-foreground hover:text-foreground/70 flex items-center gap-2 font-medium underline-offset-4 hover:underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to LegacyPlanning
          </Link>
        </div>

        <div className="border-border bg-card mb-12 rounded-2xl border p-8">
          <h1 className="text-foreground mb-6 text-3xl font-semibold tracking-tight">
            Feedback
          </h1>
          <p className="text-muted-foreground mb-8">
            We appreciate your feedback to improve LegacyPlanning. Please
            fill out the form below to let us know your thoughts, report issues,
            or suggest new features.
          </p>

          <div className="mb-4">
            <FeedbackForm />
          </div>
        </div>

        <footer className="text-muted-foreground py-4 text-center text-sm">
          <p>
            © {new Date().getFullYear()} LegacyPlanning. All rights
            reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}
