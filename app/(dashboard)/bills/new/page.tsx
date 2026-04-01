import { BillForm } from "@/components/bill-form"
import { createBill } from "@/lib/actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface NewBillPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function NewBillPage({ searchParams }: NewBillPageProps) {
  const params = await searchParams
  const defaultDate = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : undefined

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/bills">
          <Button variant="ghost" size="sm" className="h-10 min-w-[44px]">← Voltar</Button>
        </Link>
        <h2 className="text-xl font-bold text-foreground">Nova Conta</h2>
      </div>
      <BillForm
        action={createBill}
        submitLabel="Criar conta"
        defaultValues={defaultDate ? { dueDate: defaultDate } : undefined}
      />
    </div>
  )
}
