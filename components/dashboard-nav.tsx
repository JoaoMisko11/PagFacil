"use client"

import { useState } from "react"
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

const navLinks = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/pagamentos", label: "Pagamentos", exact: true },
  { href: "/bills", label: "Contas", exact: false },
  { href: "/family", label: "Família", exact: true },
  { href: "/settings", label: "Lembretes", exact: true },
]

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
        {/* Logo + nav links (desktop) */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">P</span>
            </div>
            <h1 className="hidden text-xl font-bold text-foreground sm:block">PagaFácil</h1>
          </Link>
          <div className="hidden gap-1 text-sm md:flex">
            {navLinks.map((link) => (
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

        {/* Desktop controls */}
        <div className="hidden items-center gap-2 md:flex">
          <span className="text-sm text-muted-foreground">
            {user.name ?? user.email}
          </span>
          <DisplayModeToggle />
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="h-9 min-w-[44px] rounded-full text-sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sair
          </Button>
        </div>

        {/* Mobile hamburger button */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border px-3 pb-3 md:hidden">
          <div className="flex flex-col gap-1 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href, link.exact)
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-border pt-2">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-sm text-muted-foreground">
                {user.name ?? user.email}
              </span>
              <div className="flex items-center gap-1">
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
      )}
    </nav>
  )
}
