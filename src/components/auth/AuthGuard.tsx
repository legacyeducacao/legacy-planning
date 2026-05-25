"use client"

import { Loader2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { type ReactNode, useEffect } from "react"
import { useAuth } from "./AuthProvider"

const PUBLIC_ROUTES = new Set<string>([
  "/login",
  "/terms",
  "/privacy",
  "/offline",
])

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true
  // /errors/* tambem é público
  if (pathname.startsWith("/errors/")) return true
  return false
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user && !isPublic(pathname)) {
      const next = encodeURIComponent(pathname || "/")
      router.replace(`/login?next=${next}`)
    }
  }, [user, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div
        className="flex h-screen w-full items-center justify-center"
        style={{ background: "var(--r-canvas)" }}
      >
        <Loader2
          className="h-6 w-6 animate-spin"
          style={{ color: "var(--r-mute)" }}
        />
      </div>
    )
  }

  // Rotas públicas renderizam direto
  if (isPublic(pathname)) return <>{children}</>

  // Sem usuário e rota privada — o useEffect vai redirecionar, mostra loading
  if (!user) {
    return (
      <div
        className="flex h-screen w-full items-center justify-center"
        style={{ background: "var(--r-canvas)" }}
      >
        <Loader2
          className="h-6 w-6 animate-spin"
          style={{ color: "var(--r-mute)" }}
        />
      </div>
    )
  }

  return <>{children}</>
}
