"use client"

import {
  BookOpen,
  Clock,
  ExternalLink,
  Heart,
  Home,
  MessageCircle,
  MoreHorizontal,
  ScrollText,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/history", label: "History" },
  { href: "/about", label: "About" },
  { href: "/documentation", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
]

const MOBILE_TABS = [
  { href: "/", label: "Transcribe", icon: Home },
  { href: "/history", label: "History", icon: Clock },
  { href: "/documentation", label: "Docs", icon: BookOpen },
]

const MOBILE_MENU_ITEMS = [
  { href: "/about", label: "About", icon: ScrollText },
  { href: "/changelog", label: "Changelog", icon: ScrollText },
  { href: "/terms", label: "Terms", icon: ScrollText },
  { href: "/privacy", label: "Privacy", icon: ScrollText },
]

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMoreActive = MOBILE_MENU_ITEMS.some((item) =>
    isRouteActive(pathname, item.href),
  )

  const openFeedback = () => {
    if (globalThis.window?.openFeedbackModal) {
      globalThis.window.openFeedbackModal("general")
    }
  }

  const mobileMenuContent = (
    <DropdownMenuContent align="end" className="w-48">
      {MOBILE_MENU_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = isRouteActive(pathname, item.href)

        return (
          <DropdownMenuItem
            key={item.href}
            className={cn(
              isActive &&
                "bg-accent text-accent-foreground **:text-accent-foreground",
            )}
            asChild
          >
            <Link href={item.href} onClick={() => setMobileMenuOpen(false)}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        )
      })}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          openFeedback()
          setMobileMenuOpen(false)
        }}
      >
        <MessageCircle className="h-4 w-4" />
        Feedback
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <a
          href="https://github.com/aramb-dev/transcriptr"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMobileMenuOpen(false)}
        >
          <ExternalLink className="h-4 w-4" />
          GitHub
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <a
          href="https://donate.stripe.com/3cIeVe2e5dHxeEh7BKfUQ0h"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Heart className="h-4 w-4" />
          Donate
        </a>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  return (
    <header className="border-border bg-card/80 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="container mx-auto flex h-12 items-center justify-between px-4 md:h-14">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-foreground text-lg font-bold">Transcriptr</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                isRouteActive(pathname, item.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Spacer to balance the logo on the left in mobile layout */}
        <div className="h-8 w-8 md:hidden" aria-hidden="true" />
      </div>

      <nav className="border-border grid grid-cols-4 gap-1 border-t px-2 py-1.5 md:hidden">
        {MOBILE_TABS.map((item) => {
          const Icon = item.icon
          const isActive = isRouteActive(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md text-xs transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          )
        })}

        <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-10 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md text-xs transition-colors",
                mobileMenuOpen || isMoreActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
              aria-label="Open more navigation"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span>More</span>
            </button>
          </DropdownMenuTrigger>
          {mobileMenuContent}
        </DropdownMenu>
      </nav>
    </header>
  )
}
