"use client"

import { Bell, ChevronDown, LogOut, Search, Settings, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CURRENT_USER } from "@/lib/user"

function breadcrumbLabel(path: string): string {
  if (path === "/") return "Início"
  const first = path.split("/").filter(Boolean)[0]
  const map: Record<string, string> = {
    atas: "Atas",
    tarefas: "Tarefas",
    history: "Histórico",
    planner: "Planner AI",
    studio: "Studio",
    transcribe: "Transcrição",
    documentation: "Documentação",
    settings: "Configurações",
    about: "Sobre",
    changelog: "Novidades",
    terms: "Termos",
    privacy: "Privacidade",
    feedback: "Feedback",
  }
  return map[first] ?? first.charAt(0).toUpperCase() + first.slice(1)
}

export function TopBar() {
  const pathname = usePathname()
  const crumb = breadcrumbLabel(pathname)

  return (
    <header
      className="sticky top-0 z-30 hidden h-16 items-center justify-between gap-4 px-8 md:flex"
      style={{
        background: "var(--r-canvas)",
        borderBottom: "1px solid var(--r-hairline)",
      }}
    >
      {/* Left: breadcrumb */}
      <div
        className="text-[13px] font-medium"
        style={{ color: "var(--r-charcoal)" }}
      >
        {crumb}
      </div>

      {/* Right: icon buttons + user pill */}
      <div className="flex items-center gap-2">
        <IconPill ariaLabel="Buscar">
          <Search className="h-4 w-4" />
        </IconPill>
        <IconPill ariaLabel="Notificações">
          <Bell className="h-4 w-4" />
        </IconPill>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors"
              style={{
                border: "1px solid var(--r-hairline)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(32,32,32,0.04)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
              }}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{
                  background: "var(--r-primary)",
                  color: "var(--r-on-dark)",
                }}
              >
                {CURRENT_USER.iniciais}
              </span>
              <span
                className="text-[13px] font-medium"
                style={{ color: "var(--r-ink)" }}
              >
                {CURRENT_USER.nomeCurto}
              </span>
              <ChevronDown
                className="h-3.5 w-3.5"
                style={{ color: "var(--r-charcoal)" }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link href="/about">
                <User className="h-4 w-4" />
                Meu perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function IconPill({
  ariaLabel,
  children,
}: {
  ariaLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
      style={{
        border: "1px solid var(--r-hairline)",
        background: "transparent",
        color: "var(--r-charcoal)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(32,32,32,0.04)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent"
      }}
    >
      {children}
    </button>
  )
}
