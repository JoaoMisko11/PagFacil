import Link from "next/link"
import { ImportBills } from "@/components/import-bills"

export default function ImportBillsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Importar Contas</h1>
          <p className="text-sm text-muted-foreground">
            Importe contas de uma planilha Excel ou CSV
          </p>
        </div>
        <Link
          href="/bills"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Voltar
        </Link>
      </div>

      <ImportBills />
    </div>
  )
}
