import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { BillManageCard } from "@/components/bill-manage-card"
import { BillFilters } from "@/components/bill-filters"

interface BillsPageProps {
  searchParams: Promise<{
    status?: string
    category?: string
    q?: string
  }>
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error("Não autenticado")
  const params = await searchParams

  const where: Record<string, unknown> = {
    userId,
    deletedAt: null,
  }

  if (params.status && params.status !== "ALL") {
    where.status = params.status
  }

  if (params.category && params.category !== "ALL") {
    where.category = params.category
  }

  if (params.q) {
    where.supplier = { contains: params.q, mode: "insensitive" }
  }

  const bills = await db.bill.findMany({
    where,
    orderBy: { dueDate: "asc" },
  })

  // Agrupar por fornecedor + categoria (chave composta)
  // Contas recorrentes com mesmo fornecedor/categoria viram uma entrada só
  const groups = new Map<
    string,
    {
      supplier: string
      category: string
      amount: number
      isRecurring: boolean
      recurrenceFrequency: string | null
      nextPendingId?: string
      anyId: string
      nextDueDate: Date | null
    }
  >()

  for (const bill of bills) {
    const key = bill.isRecurring
      ? `${bill.supplier}::recurring`
      : `${bill.id}` // não-recorrentes mantêm entrada individual

    const existing = groups.get(key)

    if (existing) {
      if (bill.status === "PENDING" && !existing.nextPendingId) {
        existing.nextPendingId = bill.id
        existing.nextDueDate = bill.dueDate
        existing.amount = bill.amount
        existing.category = bill.category // usar categoria da próxima pendente
      }
    } else {
      groups.set(key, {
        supplier: bill.supplier,
        category: bill.category,
        amount: bill.amount,
        isRecurring: bill.isRecurring,
        recurrenceFrequency: bill.recurrenceFrequency,
        nextPendingId: bill.status === "PENDING" ? bill.id : undefined,
        anyId: bill.id,
        nextDueDate: bill.status === "PENDING" ? bill.dueDate : null,
      })
    }
  }

  const groupedBills = Array.from(groups.values())


  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Minhas Contas</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie suas contas cadastradas. Para pagar, use a aba Pagamentos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/bills/trash">
            <Button variant="ghost" size="sm" className="text-muted-foreground">Lixeira</Button>
          </Link>
          <Link href="/bills/batch">
            <Button variant="outline" size="sm">+ Lote</Button>
          </Link>
          <Link href="/bills/import">
            <Button variant="outline" size="sm">Importar</Button>
          </Link>
          <Link href="/bills/new">
            <Button size="sm">+ Nova Conta</Button>
          </Link>
        </div>
      </div>

      <BillFilters
        currentStatus={params.status}
        currentCategory={params.category}
        currentQuery={params.q}
      />

      {groupedBills.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <p className="text-lg font-medium">Nenhuma conta encontrada</p>
          <p className="mt-1 text-sm">
            {params.status || params.category || params.q
              ? "Tente mudar os filtros."
              : "Cadastre sua primeira conta clicando no botão acima."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {groupedBills.map((item) => (
            <BillManageCard
              key={item.anyId}
              supplier={item.supplier}
              category={item.category}
              amount={item.amount}
              isRecurring={item.isRecurring}
              recurrenceFrequency={item.recurrenceFrequency}
              nextPendingId={item.nextPendingId}
              anyId={item.anyId}
              nextDueDate={item.nextDueDate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
