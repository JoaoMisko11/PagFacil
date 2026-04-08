"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

/**
 * Mobile: botão de calendário + overlay controlado por CSS (não conditional render).
 * O children (Suspense) sempre monta, só fica hidden/visible.
 */
export function MobileCalendarTrigger({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        overlayRef.current && !overlayRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div className="lg:hidden">
      {/* Botão ícone */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-center rounded-md border px-2.5 py-1.5 transition-colors ${
          open
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
        }`}
        aria-label={open ? "Fechar calendario" : "Abrir calendario"}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {/* Overlay — sempre montado, visibilidade por CSS */}
      <div
        ref={overlayRef}
        className={`fixed inset-x-0 top-0 z-50 p-4 pt-20 transition-all duration-200 ${
          open
            ? "visible opacity-100 translate-y-0"
            : "invisible opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/20 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        {/* Calendar card */}
        <div className="relative mx-auto max-w-sm rounded-lg border bg-card shadow-xl">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Badge showing active date filter with clear button.
 */
export function DateFilterBadge({ date }: { date: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const formatted = new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })

  function clearDate() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("date")
    startTransition(() => {
      router.push(`/pagamentos?${params.toString()}`)
    })
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span className="font-medium capitalize">{formatted}</span>
      <button
        onClick={clearDate}
        disabled={isPending}
        className="ml-1 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Limpar filtro de data"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
