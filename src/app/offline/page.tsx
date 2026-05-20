import { WifiOff } from "lucide-react"
import Link from "next/link"
import { LogoApex } from "@/components/brand/LogoApex"

export const metadata = {
  title: "Offline — LegacyPlanning",
}

export default function OfflinePage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--r-canvas)" }}
    >
      <div className="mb-6 opacity-80">
        <LogoApex
          size={36}
          color="var(--r-ink)"
          accent="var(--r-primary, #4a78ff)"
        />
      </div>
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          background: "var(--r-surface-bone)",
          border: "1px solid var(--r-hairline)",
        }}
      >
        <WifiOff className="h-5 w-5" style={{ color: "var(--r-mute)" }} />
      </div>
      <h1
        className="mb-2"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "28px",
          fontWeight: 700,
          letterSpacing: "-0.5px",
          color: "var(--r-ink)",
        }}
      >
        Sem conexão
      </h1>
      <p
        className="mb-6 max-w-sm text-[14px]"
        style={{ color: "var(--r-body)" }}
      >
        Você está offline. Reconecte pra transcrever áudios novos ou gerar atas
        — atas já geradas ficam disponíveis localmente.
      </p>
      <Link
        href="/"
        className="rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors"
        style={{
          background: "var(--r-primary)",
          color: "var(--r-on-dark)",
        }}
      >
        Tentar novamente
      </Link>
    </div>
  )
}
