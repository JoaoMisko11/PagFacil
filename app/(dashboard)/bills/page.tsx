import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { BillCard } from "@/components/bill-card"
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
  const params = await searchParams

  const where: Record<string, unknown> = {
    userId: session!.user!.id,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-foreground">Contas a Pagar</h2>
        <div className="flex flex-wrap gap-2">
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

      {bills.length === 0 ? (
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
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  )
}
