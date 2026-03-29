"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BillFiltersProps {
  currentStatus?: string
  currentCategory?: string
  currentQuery?: string
}

export function BillFilters({
  currentStatus,
  currentCategory,
  currentQuery,
}: BillFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentQuery ?? "")
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "ALL") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/bills?${params.toString()}`)
  }

  useEffect(() => {
    timeoutRef.current = setTimeout(() => updateFilter("q", search), 300)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Buscar fornecedor..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-11 sm:h-9 sm:max-w-[200px]"
      />
      <Select
        defaultValue={currentStatus ?? "ALL"}
        onValueChange={(v) => updateFilter("status", v ?? "ALL")}
      >
        <SelectTrigger className="h-11 sm:h-9 sm:max-w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          <SelectItem value="PENDING">Pendentes</SelectItem>
          <SelectItem value="PAID">Pagas</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={currentCategory ?? "ALL"}
        onValueChange={(v) => updateFilter("category", v ?? "ALL")}
      >
        <SelectTrigger className="h-11 sm:h-9 sm:max-w-[160px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas</SelectItem>
          <SelectItem value="FIXO">Fixo</SelectItem>
          <SelectItem value="VARIAVEL">Variável</SelectItem>
          <SelectItem value="IMPOSTO">Imposto</SelectItem>
          <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
          <SelectItem value="ASSINATURA">Assinatura</SelectItem>
          <SelectItem value="OUTRO">Outro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
