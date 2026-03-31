"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { parseSpreadsheet, importBills } from "@/lib/actions"
import type { ImportResult, ImportBillRow } from "@/lib/actions"
import { useRouter } from "next/navigation"

export function ImportBills() {
  const router = useRouter()
  const [rows, setRows] = useState<ImportBillRow[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

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

  return (
    <div className="space-y-6">
      {/* Upload */}
      {!rows && (
        <form action={parseAction} className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
            <div className="mb-4 text-4xl">📄</div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Arraste sua planilha ou clique para selecionar
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Formatos aceitos: .xlsx, .xls, .csv (máx. 5MB)
            </p>
            <input
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

          <div className="max-h-96 overflow-auto rounded-lg border border-border">
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
