"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { DisplayModeToggle } from "@/components/display-mode-toggle"

interface DashboardNavProps {
  user: {
    name?: string | null
    email?: string | null
  }
}

const mainLinks = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/pagamentos", label: "A Pagar", exact: true },
  { href: "/insights", label: "Insights", exact: true },
  { href: "/bills", label: "Minhas Contas", exact: false },
]

const menuLinks = [
  { href: "/family", label: "Família", exact: true },
  { href: "/settings", label: "Lembretes", exact: true },
]

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  const allLinks = [...mainLinks, ...menuLinks]

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
        {/* Logo + user name + main nav (desktop) */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">P</span>
            </div>
            <span className="text-sm font-semibold text-foreground sm:text-base">
              {user.name ?? user.email}
            </span>
          </Link>
          <div className="hidden gap-1 text-sm md:flex">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                  isActive(link.href, link.exact)
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop: toggles + hamburger with dropdown */}
        <div className="relative flex items-center gap-1" ref={menuRef}>
          <div className="hidden md:flex items-center gap-1">
            <DisplayModeToggle />
            <ThemeToggle />
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Dropdown menu */}
          <div
            className={`absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-lg border border-border bg-card shadow-lg transition-all duration-200 ${
              menuOpen
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-95 opacity-0"
            }`}
          >
            <div className="px-2 py-2">
              {/* Mobile: all links */}
              <div className="flex flex-col gap-0.5 md:hidden">
                {allLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(link.href, link.exact)
                        ? "bg-secondary text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              {/* Desktop: only secondary links */}
              <div className="hidden flex-col gap-0.5 md:flex">
                {menuLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(link.href, link.exact)
                        ? "bg-secondary text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-border px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate">
                  {user.email}
                </span>
                <div className="flex items-center gap-1 md:hidden">
                  <DisplayModeToggle />
                  <ThemeToggle />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-9 w-full rounded-lg text-sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
