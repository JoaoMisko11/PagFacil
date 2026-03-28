"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface DashboardNavProps {
  user: {
    name?: string | null
    email?: string | null
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className="border-b border-[#BCC8D6] bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00A868]">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <h1 className="hidden text-xl font-bold text-[#20252A] sm:block">PagaFácil</h1>
          </Link>
          <div className="flex gap-1 text-sm">
            <Link
              href="/"
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                pathname === "/"
                  ? "bg-[#E8F5EE] text-[#00A868]"
                  : "text-[#6B7685] hover:bg-[#F0F2F5] hover:text-[#20252A]"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/bills"
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                pathname.startsWith("/bills")
                  ? "bg-[#E8F5EE] text-[#00A868]"
                  : "text-[#6B7685] hover:bg-[#F0F2F5] hover:text-[#20252A]"
              }`}
            >
              Contas
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-sm text-[#6B7685] sm:inline">
            {user.name ?? user.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-9 min-w-[44px] rounded-full border-[#BCC8D6] text-xs text-[#20252A] hover:bg-[#F0F2F5] sm:text-sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sair
          </Button>
        </div>
      </div>
    </nav>
  )
}
