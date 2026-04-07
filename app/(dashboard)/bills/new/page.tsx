import { Suspense } from "react"
import { BillForm } from "@/components/bill-form"
import { BatchBillForm } from "@/components/batch-bill-form"
import { ImportBills } from "@/components/import-bills"
import { NewBillTabs } from "@/components/new-bill-tabs"
import { createBill } from "@/lib/actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface NewBillPageProps {
  searchParams: Promise<{ date?: string; mode?: string }>
}

export default async function NewBillPage({ searchParams }: NewBillPageProps) {
  const params = await searchParams
  const defaultDate = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : undefined
  const mode = params.mode === "batch" || params.mode === "import" ? params.mode : "manual"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Nova Conta</h2>
        <Link href="/bills">
          <Button variant="ghost" size="sm" className="h-10 min-w-[44px]">← Voltar</Button>
        </Link>
      </div>

      <Suspense fallback={null}>
        <NewBillTabs current={mode} />
      </Suspense>

      {mode === "manual" && (
        <BillForm
          action={createBill}
          submitLabel="Criar conta"
          defaultValues={defaultDate ? { dueDate: defaultDate } : undefined}
        />
      )}

      {mode === "batch" && <BatchBillForm />}

      {mode === "import" && <ImportBills />}
    </div>
  )
}
