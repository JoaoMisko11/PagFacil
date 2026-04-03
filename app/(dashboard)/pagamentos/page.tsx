import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BillCard } from "@/components/bill-card"

// --- Skeleton ---

function BillsSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-5 w-32" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="mt-3 flex gap-2 border-t pt-3">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// --- Async section ---

async function PagamentosSection({ userId }: { userId: string }) {
  const pendingBills = await db.bill.findMany({
    where: { userId, deletedAt: null, status: "PENDING" },
    orderBy: { dueDate: "asc" },
  })

  // Celebração quando tudo pago
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const paidThisMonthCount = pendingBills.length === 0
    ? await db.bill.count({
        where: { userId, deletedAt: null, status: "PAID", paidAt: { gte: monthStart, lte: monthEnd } },
      })
    : 0
  const allPaidCelebration = pendingBills.length === 0 && paidThisMonthCount > 0

  const today = new Date(now.toISOString().split("T")[0] + "T00:00:00Z")
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0)

  const overdue = pendingBills.filter((b) => b.dueDate < today)
  const thisMonth = pendingBills.filter(
    (b) => b.dueDate >= today && b.dueDate < nextMonthStart
  )
  const future = pendingBills.filter((b) => b.dueDate >= nextMonthStart)

  return (
    <>
      {/* Vencidos */}
      {overdue.length > 0 && (
        <section>
          <h3 className="mb-2 text-base font-semibold text-destructive sm:text-lg">
            Vencidos ({overdue.length})
          </h3>
          <div className="space-y-2">
            {overdue.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        </section>
      )}

      {/* Mês atual */}
      {thisMonth.length > 0 && (
        <section>
          <h3 className="mb-2 text-base font-semibold text-primary sm:text-lg">
            Este mês ({thisMonth.length})
          </h3>
          <div className="space-y-2">
            {thisMonth.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        </section>
      )}

      {/* Pagamentos futuros */}
      {future.length > 0 && (
        <section>
          <h3 className="mb-2 text-base font-semibold text-muted-foreground sm:text-lg">
            Pagamentos futuros ({future.length})
          </h3>
          <div className="space-y-2">
            {future.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        </section>
      )}

      {/* Tudo em dia / Celebração */}
      {pendingBills.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center sm:p-12">
          {allPaidCelebration ? (
            <>
              <div className="celebrate-bounce mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <span className="text-4xl">🎉</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                Todas as contas do mês pagas!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Você arrasou! {paidThisMonthCount} conta{paidThisMonthCount > 1 ? "s" : ""} paga{paidThisMonthCount > 1 ? "s" : ""} esse mês. Aproveite a tranquilidade.
              </p>
              <div className="celebrate-sparkles mx-auto mt-3 flex justify-center gap-1">
                {["✨", "⭐", "✨"].map((s, i) => (
                  <span key={i} className="animate-pulse text-lg" style={{ animationDelay: `${i * 200}ms` }}>{s}</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <span className="text-3xl">&#10003;</span>
              </div>
              <p className="text-lg font-semibold text-foreground">Tudo em dia!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nenhuma conta pendente no momento. Cadastre uma nova conta quando precisar.
              </p>
            </>
          )}
          <Link href="/bills/new" className="mt-5 inline-block">
            <Button className="h-11">+ Nova Conta</Button>
          </Link>
        </div>
      )}
    </>
  )
}

// --- Main page ---

export default async function PagamentosPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!session?.user?.name || !userId) {
    redirect("/onboarding")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Pagamentos
          </h2>
          <p className="text-sm text-muted-foreground">
            Contas organizadas por urgência. Marque como paga ao quitar.
          </p>
        </div>
        <Link href="/bills/new" className="shrink-0">
          <Button size="sm" className="sm:size-default">+ Nova Conta</Button>
        </Link>
      </div>

      <Suspense fallback={<BillsSkeleton />}>
        <PagamentosSection userId={userId} />
      </Suspense>
    </div>
  )
}
