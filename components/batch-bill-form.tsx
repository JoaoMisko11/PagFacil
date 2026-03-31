"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CATEGORIES } from "@/lib/constants"
import { createBillsBatch } from "@/lib/actions"
import type { BatchBillInput } from "@/lib/actions"
import { useRouter } from "next/navigation"

function emptyRow(): BatchBillInput {
  return { supplier: "", amount: "", dueDate: "", category: "OUTRO", notes: "", isRecurring: false }
}

export function BatchBillForm() {
  const router = useRouter()
  const [rows, setRows] = useState<BatchBillInput[]>([emptyRow(), emptyRow(), emptyRow()])
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function updateRow(index: number, field: keyof BatchBillInput, value: string | boolean) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
    // Limpa erro do campo ao editar
    setErrors((prev) => {
      const rowErrors = { ...prev[index] }
      delete rowErrors[field]
      const next = { ...prev }
      if (Object.keys(rowErrors).length === 0) {
        delete next[index]
      } else {
        next[index] = rowErrors
      }
      return next
    })
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(index: number) {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((_, i) => i !== index))
    setErrors((prev) => {
      const next: Record<number, Record<string, string>> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k)
        if (ki < index) next[ki] = v
        else if (ki > index) next[ki - 1] = v
      })
      return next
    })
  }

  // Filtra linhas completamente vazias
  function getNonEmptyRows() {
    return rows
      .map((r, i) => ({ row: r, index: i }))
      .filter(({ row }) => row.supplier.trim() || row.amount.trim() || row.dueDate.trim())
  }

  async function handleSubmit() {
    setMessage(null)
    const nonEmpty = getNonEmptyRows()

    if (nonEmpty.length === 0) {
      setMessage("Preencha pelo menos uma linha.")
      return
    }

    setSubmitting(true)
    try {
      const res = await createBillsBatch(nonEmpty.map(({ row }) => row))

      if (res.errors) {
        const errorMap: Record<number, Record<string, string>> = {}
        res.errors.forEach((e) => {
          // Mapeia o índice do array validado de volta ao índice original
          const originalIndex = nonEmpty[e.row]?.index ?? e.row
          errorMap[originalIndex] = e.fields
        })
        setErrors(errorMap)
      } else if (res.created) {
        router.push("/bills")
      } else {
        setMessage(res.message ?? "Erro ao cadastrar.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const nonEmptyCount = getNonEmptyRows().length

  return (
    <div className="space-y-4">
      {/* Header da tabela - só desktop */}
      <div className="hidden rounded-lg bg-muted p-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_120px_140px_130px_1fr_80px_40px] sm:gap-2">
        <span>Fornecedor *</span>
        <span>Valor *</span>
        <span>Vencimento *</span>
        <span>Categoria</span>
        <span>Observação</span>
        <span>Recorrente</span>
        <span></span>
      </div>

      {/* Linhas */}
      <div className="space-y-3 sm:space-y-1">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_120px_140px_130px_1fr_80px_40px] sm:border-0 sm:p-0 ${
              errors[i] ? "border-destructive/50 sm:border-destructive/0" : "border-border"
            }`}
          >
            <div>
              <label className="mb-1 block text-xs text-muted-foreground sm:hidden">Fornecedor *</label>
              <Input
                placeholder="Fornecedor"
                value={row.supplier}
                onChange={(e) => updateRow(i, "supplier", e.target.value)}
                className={`h-10 sm:h-9 ${errors[i]?.supplier ? "border-destructive" : ""}`}
              />
              {errors[i]?.supplier && (
                <p className="mt-0.5 text-xs text-destructive">{errors[i].supplier}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground sm:hidden">Valor *</label>
              <Input
                placeholder="0,00"
                value={row.amount}
                onChange={(e) => updateRow(i, "amount", e.target.value)}
                className={`h-10 sm:h-9 ${errors[i]?.amount ? "border-destructive" : ""}`}
              />
              {errors[i]?.amount && (
                <p className="mt-0.5 text-xs text-destructive">{errors[i].amount}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground sm:hidden">Vencimento *</label>
              <Input
                type="date"
                value={row.dueDate}
                onChange={(e) => updateRow(i, "dueDate", e.target.value)}
                className={`h-10 sm:h-9 ${errors[i]?.dueDate ? "border-destructive" : ""}`}
              />
              {errors[i]?.dueDate && (
                <p className="mt-0.5 text-xs text-destructive">{errors[i].dueDate}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground sm:hidden">Categoria</label>
              <select
                value={row.category}
                onChange={(e) => updateRow(i, "category", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm sm:h-9"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground sm:hidden">Observação</label>
              <Input
                placeholder="Obs (opcional)"
                value={row.notes}
                onChange={(e) => updateRow(i, "notes", e.target.value)}
                className="h-10 sm:h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="mb-1 block text-xs text-muted-foreground sm:hidden">Recorrente</label>
              <input
                type="checkbox"
                checked={row.isRecurring}
                onChange={(e) => updateRow(i, "isRecurring", e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-xs text-muted-foreground sm:hidden">
                {row.isRecurring ? "Sim" : "Não"}
              </span>
            </div>
            <div className="flex items-start justify-end sm:justify-center">
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 sm:h-9 sm:w-9"
                title="Remover linha"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Adicionar linha */}
      <Button type="button" variant="outline" onClick={addRow} className="w-full h-10 border-dashed">
        + Adicionar linha
      </Button>

      {message && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{message}</div>
      )}

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => router.push("/bills")} className="h-11">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || nonEmptyCount === 0}
          className="h-11 flex-1"
        >
          {submitting
            ? "Cadastrando..."
            : `Cadastrar ${nonEmptyCount} conta${nonEmptyCount !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  )
}
