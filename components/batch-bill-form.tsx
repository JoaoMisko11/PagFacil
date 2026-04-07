"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CATEGORIES, RECURRENCE_FREQUENCIES } from "@/lib/constants"
import { createBillsBatch } from "@/lib/actions"
import type { BatchBillInput } from "@/lib/action-types"
import { useRouter } from "next/navigation"

function emptyRow(): BatchBillInput {
  return { supplier: "", amount: "", dueDate: "", category: "OUTRO", notes: "", isRecurring: false, recurrenceFrequency: "MONTHLY", recurrenceEndDate: "" }
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
      <div className="space-y-3 sm:space-y-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`grid gap-2 rounded-lg border p-3 transition-all sm:grid-cols-[1fr_120px_140px_130px_1fr_80px_40px] sm:p-2 ${
              row.isRecurring
                ? "border-l-4 border-l-green-500 border-t-green-200 border-r-green-200 border-b-green-200 bg-green-50/50 dark:border-l-green-400 dark:border-t-green-900/30 dark:border-r-green-900/30 dark:border-b-green-900/30 dark:bg-green-950/20"
                : errors[i]
                  ? "border-destructive/50"
                  : "border-border"
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
              <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                row.isRecurring
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}>
                <input
                  type="checkbox"
                  checked={row.isRecurring}
                  onChange={(e) => updateRow(i, "isRecurring", e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border accent-green-600"
                />
                {row.isRecurring ? "Recorrente" : "Única"}
              </label>
            </div>
            <div className="flex items-start justify-end sm:justify-center">
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 sm:h-9 sm:w-9"
                title="Remover linha"
                aria-label={`Remover linha ${i + 1}`}
              >
                &times;
              </button>
            </div>

            {/* Campos de recorrência */}
            {row.isRecurring && (
              <div className="col-span-full grid grid-cols-[auto_1fr_1fr] items-center gap-3 rounded-md border border-green-200 bg-green-50/80 p-3 dark:border-green-800/40 dark:bg-green-950/30 sm:col-span-full">
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                  <span className="text-xs font-semibold whitespace-nowrap">Repetir</span>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-green-700 dark:text-green-300">Frequência</label>
                  <select
                    value={row.recurrenceFrequency}
                    onChange={(e) => updateRow(i, "recurrenceFrequency", e.target.value)}
                    className="h-9 w-full rounded-md border border-green-200 bg-white px-2 text-sm dark:border-green-800 dark:bg-green-950/50"
                  >
                    {RECURRENCE_FREQUENCIES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-green-700 dark:text-green-300">Data de fim (opcional)</label>
                  <Input
                    type="date"
                    value={row.recurrenceEndDate}
                    onChange={(e) => updateRow(i, "recurrenceEndDate", e.target.value)}
                    className="h-9 border-green-200 dark:border-green-800"
                  />
                </div>
              </div>
            )}
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
