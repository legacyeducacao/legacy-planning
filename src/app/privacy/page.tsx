import Link from "next/link"
import { AnalyticsOptOut } from "@/components/analytics/AnalyticsOptOut"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

const LAST_UPDATED = "April 27, 2026"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-8 sm:py-10">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground hover:underline">
              Back to Transcriptr
            </Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-foreground hover:underline">
              Terms
            </Link>
          </div>

          <article className="prose prose-slate max-w-none dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p>Last updated: {LAST_UPDATED}</p>

            <p>
              This page explains what Transcriptr collects, how we use it, and
              which third-party services are involved when you use the app.
            </p>

            <h2>1. Information We Collect</h2>

            <h3>Audio and media you submit</h3>
            <p>
              When you upload a file or provide a supported media source for
              transcription, we process that content to generate transcript
              output. Some requests may require temporary cloud handling to
              complete the transcription workflow.
            </p>

            <h3>Feedback submissions</h3>
            <p>
              When you open the in-app feedback form, the embedded Tally form
              can receive the information you enter along with extra context we
              pass through the embed URL. That context currently includes:
            </p>
            <ul>
              <li>The feedback type you selected</li>
              <li>Your browser and operating system details</li>
              <li>The current page path and full page URL</li>
              <li>Any query parameters already present in the page URL</li>
            </ul>

            <h3>Usage analytics</h3>
            <p>
              We use Vercel Web Analytics to understand basic product usage and
              performance. We strip query strings from tracked page URLs before
              events are sent, and you can disable analytics for your browser on
              this page.
            </p>

            <h2>2. How We Use Information</h2>
            <p>We use collected information to:</p>
            <ul>
              <li>Process transcription requests</li>
              <li>Operate and troubleshoot the app</li>
              <li>Understand product usage and improve reliability</li>
              <li>Review feedback, bug reports, and feature requests</li>
            </ul>

            <h2>3. Storage and Retention</h2>
            <p>
              We do not intend Transcriptr to be long-term storage for your
              uploaded media. When a workflow requires Firebase Storage, files
              are stored temporarily to complete processing and are intended to
              be deleted afterward.
            </p>
            <p>
              Deletion is not guaranteed to be instantaneous. Operational
              issues, failed cleanup, or provider-side delays can occasionally
              cause temporary files to remain longer than intended.
            </p>

            <h2>4. Third-Party Services</h2>
            <p>Transcriptr currently relies on these third-party services:</p>
            <ul>
              <li>AssemblyAI for transcription processing</li>
              <li>Firebase Storage for temporary file handling when needed</li>
              <li>Vercel Web Analytics for anonymized usage analytics</li>
              <li>Tally for embedded feedback form submissions</li>
            </ul>

            <h2>5. Your Choices</h2>
            <p>You can:</p>
            <ul>
              <li>Choose not to submit feedback through the embedded form</li>
              <li>Disable Vercel Web Analytics for this browser</li>
              <li>Contact us with questions about data handling or deletion</li>
            </ul>

            <AnalyticsOptOut />

            <h2>6. Changes to This Policy</h2>
            <p>
              We may update this policy as the product changes. When we make
              material updates, we will revise the date at the top of this
              page.
            </p>

            <h2>7. Contact</h2>
            <p>
              Questions about this policy can be sent to{" "}
              <a href="mailto:contact@aramb.dev">contact@aramb.dev</a>.
            </p>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}
