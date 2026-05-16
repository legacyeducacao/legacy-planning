import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google"
import { VercelAnalytics } from "@/components/analytics/VercelAnalytics"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { FeedbackModals } from "@/components/feedback/FeedbackModals"
import { PWARegister } from "@/components/pwa/PWARegister"
import "../index.css"
import { AppShell } from "@/components/layout/AppShell"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
})

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["500", "600", "700"],
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500"],
})

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: "LegacyPlanning | Transcrição de áudio com IA",
  description:
    "Converte áudio em texto com transcrição por inteligência artificial. Suporta múltiplos formatos e idiomas, com resultados rápidos e precisos.",
  keywords:
    "transcrição de áudio, transcrição com IA, áudio para texto, converter áudio em texto, assemblyai, whisper",
  authors: [{ name: "LegacyPlanning" }],
  robots: "index, follow",
  manifest: "/manifest.json",
  applicationName: "LegacyPlanning",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LegacyPlanning",
  },
  icons: {
    icon: [
      { url: "/brand/pwa-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/pwa-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: ["/brand/legacy-mark.png"],
  },
  formatDetection: { telephone: false },
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f7f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
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
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${bricolage.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans" suppressHydrationWarning>
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <FeedbackModals />
          <VercelAnalytics />
          <PWARegister />
        </AuthProvider>
      </body>
    </html>
  )
}
