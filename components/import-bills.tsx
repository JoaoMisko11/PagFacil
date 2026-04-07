"use client"

import { useActionState, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { parseSpreadsheet, importBills } from "@/lib/actions"
import type { ImportResult, ImportBillRow } from "@/lib/action-types"
import { useRouter } from "next/navigation"

export function ImportBills() {
  const router = useRouter()
  const [rows, setRows] = useState<ImportBillRow[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const dragCounterRef = useRef(0)

  const [parseState, parseAction, parsePending] = useActionState(
    async (prev: ImportResult, formData: FormData) => {
      const res = await parseSpreadsheet(prev, formData)
      if (res.rows) setRows(res.rows)
      return res
    },
    {} as ImportResult
  )

  const validCount = rows?.filter((r) => r.valid).length ?? 0
  const invalidCount = rows?.filter((r) => !r.valid).length ?? 0

  async function handleImport() {
    if (!rows || validCount === 0) return
    setImporting(true)
    try {
      const res = await importBills(rows)
      if (res.imported) {
        router.push("/bills")
      } else {
        setResult(res.message ?? "Erro ao importar.")
      }
    } finally {
      setImporting(false)
    }
  }

  function handleReset() {
    setRows(null)
    setResult(null)
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true)
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const files = e.dataTransfer.files
    if (files.length > 0 && fileInputRef.current) {
      fileInputRef.current.files = files
      // Auto-submit the form
      formRef.current?.requestSubmit()
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      {!rows && (
        <form ref={formRef} action={parseAction} className="space-y-4">
          <div
            className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="mb-4 text-4xl">{isDragging ? "&#128229;" : "&#128196;"}</div>
            <p className="mb-2 text-sm font-medium text-foreground">
              {isDragging ? "Solte o arquivo aqui" : "Arraste sua planilha ou clique para selecionar"}
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Formatos aceitos: .xlsx, .xls, .csv (max. 5MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept=".xlsx,.xls,.csv"
              className="mx-auto block w-full max-w-xs text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
              required
            />
          </div>

          {parseState.message && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {parseState.message}
            </div>
          )}

          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">Formato esperado da planilha:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-1 pr-4">Fornecedor*</th>
                    <th className="pb-1 pr-4">Valor*</th>
                    <th className="pb-1 pr-4">Vencimento*</th>
                    <th className="pb-1 pr-4">Categoria</th>
                    <th className="pb-1">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="pr-4 pt-1">Enel</td>
                    <td className="pr-4 pt-1">150,00</td>
                    <td className="pr-4 pt-1">15/04/2026</td>
                    <td className="pr-4 pt-1">Fixo</td>
                    <td className="pt-1">Conta de luz</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs">* Colunas obrigatórias. Categoria padrão: Outro.</p>
          </div>

          <Button type="submit" disabled={parsePending} className="w-full h-11">
            {parsePending ? "Analisando..." : "Analisar Planilha"}
          </Button>
        </form>
      )}

      {/* Preview */}
      {rows && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              {validCount} válida{validCount !== 1 ? "s" : ""}
            </div>
            {invalidCount > 0 && (
              <div className="rounded-lg bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">
                {invalidCount} com erro{invalidCount !== 1 ? "s" : ""}
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              de {rows.length} linha{rows.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Desktop: tabela */}
          <div className="hidden sm:block max-h-96 overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr className="border-b border-border text-left">
                  <th className="p-2 text-xs font-medium">#</th>
                  <th className="p-2 text-xs font-medium">Fornecedor</th>
                  <th className="p-2 text-xs font-medium">Valor</th>
                  <th className="p-2 text-xs font-medium">Vencimento</th>
                  <th className="p-2 text-xs font-medium">Categoria</th>
                  <th className="p-2 text-xs font-medium">Obs</th>
                  <th className="p-2 text-xs font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.row}
                    className={`border-b border-border ${
                      row.valid
                        ? "bg-green-50 dark:bg-green-950/20"
                        : "bg-red-50 dark:bg-red-950/20"
                    }`}
                  >
                    <td className="p-2 text-xs text-muted-foreground">{row.row}</td>
                    <td className="p-2">{row.supplier || "—"}</td>
                    <td className="p-2">{row.amount || "—"}</td>
                    <td className="p-2">{row.dueDate || "—"}</td>
                    <td className="p-2">{row.category}</td>
                    <td className="p-2 max-w-32 truncate">{row.notes || "—"}</td>
                    <td className="p-2 text-xs">
                      {row.valid ? (
                        <span className="text-green-600 dark:text-green-400">OK</span>
                      ) : (
                        <span className="text-destructive" title={row.error}>
                          {row.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="sm:hidden max-h-96 overflow-auto space-y-2">
            {rows.map((row) => (
              <div
                key={row.row}
                className={`rounded-lg border p-3 text-sm ${
                  row.valid
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                    : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{row.supplier || "—"}</p>
                  <span className="text-xs text-muted-foreground">#{row.row}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{row.amount || "—"}</span>
                  <span>{row.dueDate || "—"}</span>
                  <span>{row.category}</span>
                </div>
                {row.notes && (
                  <p className="mt-1 text-xs text-muted-foreground truncate">{row.notes}</p>
                )}
                {!row.valid && (
                  <p className="mt-1.5 text-xs text-destructive">{row.error}</p>
                )}
              </div>
            ))}
          </div>

          {result && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {result}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="h-11">
              Voltar
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="h-11 flex-1"
            >
              {importing
                ? "Importando..."
                : `Importar ${validCount} conta${validCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
