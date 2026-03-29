import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { BillForm } from "@/components/bill-form"
import { updateBill } from "@/lib/actions"
import { formatDateInput } from "@/lib/format"

interface EditBillPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBillPage({ params }: EditBillPageProps) {
  const session = await auth()
  const { id } = await params

  const bill = await db.bill.findUnique({
    where: { id, userId: session!.user!.id, deletedAt: null },
  })

  if (!bill) notFound()

  const action = updateBill.bind(null, bill.id)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/bills">
          <Button variant="ghost" size="sm" className="h-10 min-w-[44px]">← Voltar</Button>
        </Link>
        <h2 className="text-xl font-bold text-foreground">Editar Conta</h2>
      </div>
      <BillForm
        action={action}
        defaultValues={{
          supplier: bill.supplier,
          amount: (bill.amount / 100).toFixed(2).replace(".", ","),
          dueDate: formatDateInput(bill.dueDate),
          category: bill.category,
          notes: bill.notes ?? "",
          isRecurring: bill.isRecurring,
          recurrenceFrequency: bill.recurrenceFrequency ?? undefined,
          recurrenceEndDate: bill.recurrenceEndDate
            ? formatDateInput(bill.recurrenceEndDate)
            : undefined,
        }}
        submitLabel="Salvar alterações"
      />
    </div>
  )
}
