import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BillCard } from "@/components/bill-card"
import { formatCurrency } from "@/lib/format"
import { PagamentosTabs } from "@/components/pagamentos-tabs"
import { getFamilyUserIds } from "@/lib/family"

// --- Skeleton ---

function BillsSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-5 w-32" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-l-[3px] border-l-muted bg-background p-2.5">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Async section ---

async function PagamentosSection({ userIds, tab }: { userIds: string[]; tab: string }) {
  const pendingBills = await db.bill.findMany({
    where: { userId: { in: userIds }, deletedAt: null, status: "PENDING" },
    orderBy: { dueDate: "asc" },
  })

  const now = new Date()
  const today = new Date(now.toISOString().split("T")[0] + "T00:00:00Z")
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0)

  const overdue = pendingBills.filter((b) => b.dueDate < today)
  const thisMonth = pendingBills.filter(
    (b) => b.dueDate >= today && b.dueDate < nextMonthStart
  )
  const future = pendingBills.filter((b) => b.dueDate >= nextMonthStart)

  const counts = {
    overdue: overdue.length,
    month: thisMonth.length,
    future: future.length,
    all: pendingBills.length,
  }

  let visibleBills: typeof pendingBills
  switch (tab) {
    case "overdue":
      visibleBills = overdue
      break
    case "future":
      visibleBills = future
      break
    case "all":
      visibleBills = pendingBills
      break
    case "month":
    default:
      visibleBills = thisMonth
  }

  // Celebração quando tudo pago
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const paidThisMonthCount = pendingBills.length === 0
    ? await db.bill.count({
        where: { userId: { in: userIds }, deletedAt: null, status: "PAID", paidAt: { gte: monthStart, lte: monthEnd } },
      })
    : 0
  const allPaidCelebration = pendingBills.length === 0 && paidThisMonthCount > 0

  return (
    <>
      <PagamentosTabs current={tab} counts={counts} />

      {visibleBills.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {visibleBills.length} {visibleBills.length === 1 ? "conta" : "contas"} · <span className="font-semibold text-foreground">{formatCurrency(visibleBills.reduce((s, b) => s + b.amount, 0))}</span>
        </p>
      )}

      {visibleBills.length > 0 ? (
        <div className="space-y-2">
          {visibleBills.map((bill) => (
            <BillCard key={bill.id} bill={bill} />
          ))}
        </div>
      ) : pendingBills.length === 0 ? (
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
      ) : (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          <p className="text-sm">Nenhuma conta nesta aba.</p>
        </div>
      )}
    </>
  )
}

// --- Main page ---

interface PagamentosPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function PagamentosPage({ searchParams }: PagamentosPageProps) {
  const session = await auth()
  const userId = session?.user?.id

  if (!session?.user?.name || !userId) {
    redirect("/onboarding")
  }

  const userIds = await getFamilyUserIds(userId)
  const params = await searchParams
  const tab = params.tab || "month"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            A Pagar
          </h2>
          <p className="text-sm text-muted-foreground">
            Contas pendentes — marque como paga ao quitar.
          </p>
        </div>
        <Link href="/bills/new" className="shrink-0">
          <Button size="sm" className="sm:size-default">+ Nova Conta</Button>
        </Link>
      </div>

      <Suspense fallback={<BillsSkeleton />}>
        <PagamentosSection userIds={userIds} tab={tab} />
      </Suspense>
    </div>
  )
}
