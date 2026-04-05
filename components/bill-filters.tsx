"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"

const CATEGORIES = [
  { value: "FIXO", label: "Fixo" },
  { value: "VARIAVEL", label: "Variável" },
  { value: "IMPOSTO", label: "Imposto" },
  { value: "FORNECEDOR", label: "Fornecedor" },
  { value: "ASSINATURA", label: "Assinatura" },
  { value: "OUTRO", label: "Outro" },
] as const

const SORT_OPTIONS = [
  { value: "dueDate", label: "Vencimento" },
  { value: "createdAt", label: "Data de criação" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
  { value: "category", label: "Categoria" },
] as const

interface BillFiltersProps {
  currentCategory?: string
  currentQuery?: string
  currentSort?: string
}

export function BillFilters({
  currentCategory,
  currentQuery,
  currentSort,
}: BillFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentQuery ?? "")
  const timeoutRef = useRef<NodeJS.Timeout>(null)
  const [isPending, startTransition] = useTransition()

  const activeCategories = new Set(
    currentCategory ? currentCategory.split(",") : []
  )

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.push(`/bills?${params.toString()}`)
    })
  }

  function toggleCategory(cat: string) {
    const next = new Set(activeCategories)
    if (next.has(cat)) {
      next.delete(cat)
    } else {
      next.add(cat)
    }
    updateParams("category", Array.from(next).join(","))
  }

  useEffect(() => {
    timeoutRef.current = setTimeout(() => updateParams("q", search), 300)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className={`space-y-2 transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <div className="flex gap-2">
        <div className="relative h-9 flex-1">
          <Input
            placeholder="Buscar fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full"
          />
          {isPending && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          )}
        </div>
        <select
          value={currentSort || "dueDate"}
          onChange={(e) => updateParams("sort", e.target.value === "dueDate" ? "" : e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategories.has(cat.value)
          return (
            <button
              key={cat.value}
              onClick={() => toggleCategory(cat.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
