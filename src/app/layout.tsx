import type { Metadata, Viewport } from "next"
import { VercelAnalytics } from "@/components/analytics/VercelAnalytics"
import { FeedbackModals } from "@/components/feedback/FeedbackModals"
import "../index.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: "LegacyPlanning | Transcrição de áudio com IA",
  description:
    "Converte áudio em texto com transcrição por inteligência artificial. Suporta múltiplos formatos e idiomas, com resultados rápidos e precisos.",
  keywords:
    "transcrição de áudio, transcrição com IA, áudio para texto, converter áudio em texto, assemblyai, whisper",
  authors: [{ name: "LegacyPlanning" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    url: "https://transcriptr.aramb.dev/",
    siteName: "LegacyPlanning",
    title: "LegacyPlanning | Transcrição de áudio com IA",
    description:
      "Converte áudio em texto com transcrição por inteligência artificial. Suporta múltiplos formatos e idiomas, com resultados rápidos e precisos.",
    images: [
      {
        url: "https://transcriptr.aramb.dev/social_preview.png",
        alt: "LegacyPlanning — converte áudio em texto com IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "https://transcriptr.aramb.dev/",
    title: "LegacyPlanning | Transcrição de áudio com IA",
    description:
      "Converte áudio em texto com transcrição por inteligência artificial. Suporta múltiplos formatos e idiomas, com resultados rápidos e precisos.",
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
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <div className="flex h-screen overflow-hidden w-full">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
        <FeedbackModals />
        <VercelAnalytics />
      </body>
    </html>
  )
}
