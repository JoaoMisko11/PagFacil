import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { BillManageCard } from "@/components/bill-manage-card"
import { BillFilters } from "@/components/bill-filters"
import { CATEGORY_MAP } from "@/lib/constants"

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
      instanceCount: number
      totalPaid: number
      nextPendingId?: string
      anyId: string
      nextDueDate: Date | null
    }
  >()

  for (const bill of bills) {
    const key = bill.isRecurring
      ? `${bill.supplier}::${bill.category}::recurring`
      : `${bill.id}` // não-recorrentes mantêm entrada individual

    const existing = groups.get(key)

    if (existing) {
      existing.instanceCount++
      if (bill.status === "PAID") {
        existing.totalPaid += bill.amount
      }
      if (bill.status === "PENDING" && !existing.nextPendingId) {
        existing.nextPendingId = bill.id
        existing.nextDueDate = bill.dueDate
        existing.amount = bill.amount // usar valor da próxima pendente
      }
    } else {
      groups.set(key, {
        supplier: bill.supplier,
        category: bill.category,
        amount: bill.amount,
        isRecurring: bill.isRecurring,
        recurrenceFrequency: bill.recurrenceFrequency,
        instanceCount: 1,
        totalPaid: bill.status === "PAID" ? bill.amount : 0,
        nextPendingId: bill.status === "PENDING" ? bill.id : undefined,
        anyId: bill.id,
        nextDueDate: bill.status === "PENDING" ? bill.dueDate : null,
      })
    }
  }

  const groupedBills = Array.from(groups.values())

  // Agrupar por categoria para a visualização
  const byCategory = new Map<string, typeof groupedBills>()
  for (const g of groupedBills) {
    const list = byCategory.get(g.category) ?? []
    list.push(g)
    byCategory.set(g.category, list)
  }

  // Ordenar categorias pela ordem do CATEGORY_MAP
  const categoryOrder = ["FIXO", "VARIAVEL", "IMPOSTO", "FORNECEDOR", "ASSINATURA", "OUTRO"]
  const sortedCategories = Array.from(byCategory.entries()).sort(
    (a, b) => categoryOrder.indexOf(a[0]) - categoryOrder.indexOf(b[0])
  )

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
        <div className="space-y-6">
          {sortedCategories.map(([category, items]) => {
            const cat = CATEGORY_MAP[category]
            return (
              <section key={category}>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground sm:text-base">
                  <span>{cat?.icon}</span>
                  <span>{cat?.label ?? category}</span>
                  <span className="text-xs font-normal">({items.length})</span>
                </h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <BillManageCard
                      key={item.anyId}
                      supplier={item.supplier}
                      category={item.category}
                      amount={item.amount}
                      isRecurring={item.isRecurring}
                      recurrenceFrequency={item.recurrenceFrequency}
                      instanceCount={item.instanceCount}
                      totalPaid={item.totalPaid}
                      nextPendingId={item.nextPendingId}
                      anyId={item.anyId}
                      nextDueDate={item.nextDueDate}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
