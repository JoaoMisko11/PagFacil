"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

const TABS = [
  { value: "month", label: "Este mês" },
  { value: "overdue", label: "Vencidas" },
  { value: "future", label: "Futuras" },
  { value: "all", label: "Todas" },
] as const

interface PagamentosTabsProps {
  current: string
  counts: { overdue: number; month: number; future: number; all: number }
}

export function PagamentosTabs({ current, counts }: PagamentosTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "month") {
      params.delete("tab")
    } else {
      params.set("tab", tab)
    }
    startTransition(() => {
      router.push(`/pagamentos?${params.toString()}`)
    })
  }

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {TABS.map((tab) => {
        const isActive = current === tab.value
        const count = counts[tab.value]
        return (
          <button
            key={tab.value}
            onClick={() => setTab(tab.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {count > 0 && (
              <span className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                isActive
                  ? tab.value === "overdue"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-primary text-primary-foreground"
                  : "bg-muted-foreground/20 text-muted-foreground"
              }`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
