import Link from "next/link"
import { Footer } from "@/components/layout/Footer"
import { Header } from "@/components/layout/Header"

const LAST_UPDATED = "April 27, 2026"

export default function TermsPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-8 sm:py-10">
        <div className="container mx-auto max-w-4xl">
          <div className="text-muted-foreground mb-6 flex flex-wrap items-center gap-3 text-sm">
            <Link href="/" className="hover:text-foreground hover:underline">
              Back to Transcriptr
            </Link>
            <span>|</span>
            <Link
              href="/privacy"
              className="hover:text-foreground hover:underline"
            >
              Privacy
            </Link>
          </div>

          <article className="legal-doc max-w-none">
            <h1>Terms of Service</h1>
            <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

            <p>
              By using Transcriptr, you agree to these terms. If you do not
              agree, do not use the service.
            </p>

            <h2>1. What the Service Does</h2>
            <p>
              Transcriptr is an audio transcription product that accepts file
              uploads and supported media sources, then uses third-party
              providers to produce transcript output and related workflow data.
            </p>

            <h2>2. Your Responsibilities</h2>
            <p>
              You are responsible for the content you submit to the service.
            </p>
            <p>You must not submit content that:</p>
            <ul>
              <li>You do not have the right to upload, share, or process</li>
              <li>Violates applicable law or another party&apos;s rights</li>
              <li>Contains malicious code or attempts to abuse the service</li>
              <li>
                Includes sensitive material you are not authorized to share
              </li>
            </ul>

            <h2>3. Acceptable Use</h2>
            <p>
              You may not use Transcriptr to interfere with the product, evade
              limits, probe for vulnerabilities, or run abusive automated
              traffic. We may block requests or restrict access if usage puts
              the service or other users at risk.
            </p>

            <h2>4. Third-Party Processing</h2>
            <p>
              Transcriptr depends on third-party services including AssemblyAI,
              Firebase Storage, Tally, and Vercel. Your use of Transcriptr also
              involves those providers where relevant to the workflow.
            </p>
            <p>
              For details about data handling, please review our{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>

            <h2>5. Accuracy and Availability</h2>
            <p>
              The service is provided on an &quot;as is&quot; basis. Transcript
              accuracy depends on the quality and characteristics of the source
              audio, provider behavior, and other technical factors. We do not
              guarantee that outputs will be complete, accurate, or available at
              all times.
            </p>

            <h2>6. Limits and Changes</h2>
            <p>
              We may introduce or adjust limits, features, or workflows at any
              time. We may also suspend or discontinue parts of the service when
              needed for product, operational, or security reasons.
            </p>

            <h2>7. Contact</h2>
            <p>
              Questions about these terms can be sent to{" "}
              <a href="mailto:contact@aramb.dev">contact@aramb.dev</a>.
            </p>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}
