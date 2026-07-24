"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useAuth } from "@/components/auth/AuthProvider"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"

const FULL_BLEED_ROUTES = new Set<string>(["/login", "/offline"])

function isFullBleed(pathname: string | null): boolean {
  if (!pathname) return false
  return FULL_BLEED_ROUTES.has(pathname)
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  // Rotas full-bleed (login) — sem chrome
  if (isFullBleed(pathname)) {
    return <AuthGuard>{children}</AuthGuard>
  }

  // Sem usuário autenticado em rota privada — AuthGuard redireciona pra /login
  if (!user) {
    return <AuthGuard>{children}</AuthGuard>
  }

  return (
    <AuthGuard>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </AuthGuard>
  )
}
