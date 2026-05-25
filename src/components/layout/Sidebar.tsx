"use client"

import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  FileAudio,
  FileText,
  Home,
  ListTodo,
  LogOut,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { signOut } from "@/lib/auth"
import { useTodosStore } from "@/stores/todos-store"

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const todos = useTodosStore((s) => s.todos)
  const loadTodos = useTodosStore((s) => s.load)

  useEffect(() => {
    loadTodos()
  }, [loadTodos])

  const openTodosCount = todos.filter((t) => !t.completed).length

  const generalNav: NavItem[] = [
    { name: "Início", href: "/", icon: Home },
    { name: "Planner AI", href: "/planner", icon: CalendarDays },
    { name: "Atas", href: "/atas", icon: FileText },
    {
      name: "Tarefas",
      href: "/tarefas",
      icon: ListTodo,
      badge: openTodosCount > 0 ? openTodosCount : undefined,
    },
    { name: "Transcrições", href: "/history", icon: FileAudio },
    // Tab exclusiva do master — mostra transcrições dos OUTROS usuários
    ...(user?.role === "master"
      ? [
          {
            name: "Equipe",
            href: "/history/equipe",
            icon: Users,
          } satisfies NavItem,
        ]
      : []),
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      router.replace("/login")
    } catch (err) {
      console.error("Falha ao sair:", err)
    }
  }

  const bottomNav: NavItem[] = [
    { name: "Documentação", href: "/documentation", icon: BookOpen },
    // Configurações removido — rota /settings ainda não existe, gerava 404
    // nos prefetches de RSC do Sidebar. Reintroduzir quando a página for criada.
  ]

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside
      className="hidden h-screen w-[280px] flex-shrink-0 flex-col md:flex"
      style={{
        background: "var(--r-surface-bone)",
        borderRight: "1px solid var(--r-hairline)",
      }}
    >
      <div className="flex h-full flex-col p-3">
        {/* Brand + collapse */}
        <div className="flex items-center justify-between gap-2 px-1.5 pt-1 pb-4">
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2.5 group"
          >
            <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center">
              <Image
                src="/brand/legacy-mark.png"
                alt="LegacyPlanning"
                width={30}
                height={30}
                className="object-contain"
                priority
              />
            </span>
            <span
              className="truncate font-semibold group-hover:opacity-80 transition-opacity"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "15px",
                fontWeight: 700,
                letterSpacing: "-0.3px",
                color: "var(--r-ink)",
              }}
            >
              LegacyPlanning
            </span>
          </Link>
          <button
            type="button"
            aria-label="Recolher sidebar"
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors"
            style={{
              border: "1px solid var(--r-hairline)",
              background: "transparent",
              color: "var(--r-charcoal)",
            }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* GERAL group */}
        <div
          className="px-2.5 pt-3.5 pb-2 text-[10px] font-semibold uppercase"
          style={{
            letterSpacing: "1px",
            color: "var(--r-ash)",
          }}
        >
          Geral
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-0.5">
            {generalNav.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors"
                    style={
                      active
                        ? {
                            background: "var(--r-surface-dark)",
                            color: "var(--r-on-dark)",
                          }
                        : {
                            color: "var(--r-ink)",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!active)
                        e.currentTarget.style.background = "rgba(32,32,32,0.05)"
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = ""
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                        style={{
                          background: active
                            ? "rgba(252,252,252,0.18)"
                            : "rgba(32,32,32,0.08)",
                          color: active
                            ? "var(--r-on-dark)"
                            : "var(--r-charcoal)",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom: secondary nav + user card */}
        <div
          className="mt-3 pt-3"
          style={{ borderTop: "1px solid var(--r-hairline)" }}
        >
          <ul className="mb-2 space-y-0.5">
            {bottomNav.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors"
                    style={
                      active
                        ? {
                            background: "var(--r-surface-dark)",
                            color: "var(--r-on-dark)",
                          }
                        : {
                            color: "var(--r-ink)",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!active)
                        e.currentTarget.style.background = "rgba(32,32,32,0.05)"
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = ""
                    }}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* User card */}
          {user && (
            <div className="flex items-center gap-2.5 rounded-full px-3 py-2">
              <span
                className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{
                  background: "var(--r-surface-dark)",
                  color: "var(--r-on-dark)",
                }}
              >
                {user.initials.slice(0, 1)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span
                  className="truncate text-[13px] font-semibold"
                  style={{ color: "var(--r-ink)" }}
                >
                  {user.displayName.split(" ")[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sair"
                title="Sair"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[rgba(32,32,32,0.06)]"
                style={{ color: "var(--r-charcoal)" }}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
