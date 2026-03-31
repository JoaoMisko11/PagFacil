import Link from "next/link"
import { BatchBillForm } from "@/components/batch-bill-form"

export default function BatchBillsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cadastro em Lote</h1>
          <p className="text-sm text-muted-foreground">
            Adicione várias contas de uma vez
          </p>
        </div>
        <Link
          href="/bills"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Voltar
        </Link>
      </div>

      <BatchBillForm />
    </div>
  )
}
