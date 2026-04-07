"use client"

import { useRouter, useSearchParams } from "next/navigation"

const TABS = [
  { value: "manual", label: "Manual" },
  { value: "batch", label: "Em lote" },
  { value: "import", label: "Importar" },
] as const

interface NewBillTabsProps {
  current: string
}

export function NewBillTabs({ current }: NewBillTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "manual") {
      params.delete("mode")
    } else {
      params.set("mode", tab)
    }
    // Preserve date param if present
    const qs = params.toString()
    router.push(`/bills/new${qs ? `?${qs}` : ""}`)
  }

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {TABS.map((tab) => {
        const isActive = current === tab.value
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
          </button>
        )
      })}
    </div>
  )
}
