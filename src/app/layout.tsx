import type { Metadata, Viewport } from "next"
import { VercelAnalytics } from "@/components/analytics/VercelAnalytics"
import { FeedbackModals } from "@/components/feedback/FeedbackModals"
import "../index.css"

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: "Transcriptr | AI Audio Transcription",
  description:
    "Convert audio to text with AI-powered transcription. Supports multiple formats and languages, providing fast and accurate results.",
  keywords:
    "audio transcription, ai transcription, speech to text, convert audio to text, assemblyai, whisper",
  authors: [{ name: "Transcriptr" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    url: "https://transcriptr.aramb.dev/",
    siteName: "Transcriptr",
    title: "Transcriptr | AI Audio Transcription",
    description:
      "Convert audio to text with AI-powered transcription. Supports multiple formats and languages, providing fast and accurate results.",
    images: [
      {
        url: "https://transcriptr.aramb.dev/social_preview.png",
        alt: "Transcriptr, convert audio to text with a fast AI powered engine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "https://transcriptr.aramb.dev/",
    title: "Transcriptr | AI Audio Transcription",
    description:
      "Convert audio to text with AI-powered transcription. Supports multiple formats and languages, providing fast and accurate results.",
    images: ["https://transcriptr.aramb.dev/social_preview.png"],
  },
}

// eslint-disable-next-line react-refresh/only-export-components
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // Support for safe areas on mobile devices
}

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <FeedbackModals />
        <VercelAnalytics />
      </body>
    </html>
  )
}
