import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { TrashBillCard } from "@/components/trash-bill-card"

export default async function TrashPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error("Não autenticado")

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const deletedBills = await db.bill.findMany({
    where: {
      userId,
      deletedAt: { not: null, gte: thirtyDaysAgo },
    },
    orderBy: { deletedAt: "desc" },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Lixeira</h2>
          <p className="text-sm text-muted-foreground">
            Contas deletadas nos ultimos 30 dias. Apos esse prazo, sao removidas permanentemente.
          </p>
        </div>
        <Link href="/bills" className="shrink-0">
          <Button variant="outline" size="sm">Voltar</Button>
        </Link>
      </div>

      {deletedBills.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center sm:p-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <span className="text-3xl">&#128465;</span>
          </div>
          <p className="text-lg font-semibold text-foreground">Lixeira vazia</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhuma conta deletada nos ultimos 30 dias.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {deletedBills.map((bill) => (
            <TrashBillCard key={bill.id} bill={bill} />
          ))}
        </div>
      )}
    </div>
  )
}
