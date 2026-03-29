"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardNavProps {
  user: {
    name?: string | null
    email?: string | null
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">P</span>
            </div>
            <h1 className="hidden text-xl font-bold text-foreground sm:block">PagaFácil</h1>
          </Link>
          <div className="flex gap-1 text-sm">
            <Link
              href="/"
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                pathname === "/"
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/bills"
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                pathname.startsWith("/bills")
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Contas
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.name ?? user.email}
          </span>
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="h-9 min-w-[44px] rounded-full text-xs sm:text-sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sair
          </Button>
        </div>
      </div>
    </nav>
  )
}
