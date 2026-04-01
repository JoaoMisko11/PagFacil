"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export function KeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignora se estiver digitando em input/textarea/select
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key) {
        case "n":
          e.preventDefault()
          router.push("/bills/new")
          break
        case "/":
          e.preventDefault()
          // Foca no input de busca se estiver na página de contas
          if (pathname === "/bills") {
            const searchInput = document.querySelector<HTMLInputElement>(
              'input[placeholder="Buscar fornecedor..."]'
            )
            searchInput?.focus()
          } else {
            router.push("/bills")
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [router, pathname])

  return null
}
