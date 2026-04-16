import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getFamilyUserIds } from "@/lib/family"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { InsightsCategoryChart } from "@/components/insights-category-chart"
import { InsightsTopSuppliers } from "@/components/insights-top-suppliers"
import { InsightsPunctuality } from "@/components/insights-punctuality"
import { InsightsForecast } from "@/components/insights-forecast"
import { InsightsMessages } from "@/components/insights-messages"
import {
  computeCategoryBreakdown,
  computeTopSuppliers,
  computePunctuality,
  computeMonthlyComparison,
  computeForecast,
  generateInsightMessages,
  type BillData,
} from "@/lib/insights-utils"
import { formatCurrency } from "@/lib/format"

function SectionSkeleton() {
  return (
    <Card>
      <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  )
}

async function InsightsContent({ userIds }: { userIds: string[] }) {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  // Fetch all bills from last 6 months in a single query
  const rawBills = await db.bill.findMany({
    where: {
      userId: { in: userIds },
      deletedAt: null,
      dueDate: { gte: sixMonthsAgo },
    },
    select: {
      supplier: true,
      amount: true,
      category: true,
      dueDate: true,
      status: true,
      paidAt: true,
      isRecurring: true,
    },
    orderBy: { dueDate: "desc" },
  })

  const bills: BillData[] = rawBills.map((b) => ({
    supplier: b.supplier,
    amount: b.amount,
    category: b.category,
    dueDate: b.dueDate,
    status: b.status,
    paidAt: b.paidAt,
    isRecurring: b.isRecurring,
  }))

  if (bills.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <p className="text-sm text-muted-foreground">
            Cadastre algumas contas para ver seus insights.
          </p>
          <Link href="/bills/new">
            <Button size="sm">+ Nova Conta</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Compute all insights
  const categoryBreakdown = computeCategoryBreakdown(bills)
  const topSuppliers = computeTopSuppliers(bills, 5)
  const punctuality = computePunctuality(bills)
  const monthlyComparison = computeMonthlyComparison(bills, 6)

  // Forecast: recurring bills that are still active
  const activeRecurring = await db.bill.findMany({
    where: {
      userId: { in: userIds },
      deletedAt: null,
      isRecurring: true,
      status: "PENDING",
    },
    select: {
      supplier: true,
      amount: true,
      category: true,
      dueDate: true,
      status: true,
      paidAt: true,
      isRecurring: true,
    },
  })

  const recurringBills: BillData[] = activeRecurring.map((b) => ({
    supplier: b.supplier,
    amount: b.amount,
    category: b.category,
    dueDate: b.dueDate,
    status: b.status,
    paidAt: b.paidAt,
    isRecurring: b.isRecurring,
  }))

  const forecast = computeForecast(bills, recurringBills)
  const messages = generateInsightMessages(categoryBreakdown, punctuality, monthlyComparison, forecast)

  // Total gasto nos ultimos 6 meses
  const totalSpent = bills
    .filter((b) => b.status === "PAID")
    .reduce((sum, b) => sum + b.amount, 0)

  // Month variation
  const currentMonth = monthlyComparison[monthlyComparison.length - 1]
  const previousMonth = monthlyComparison.length >= 2 ? monthlyComparison[monthlyComparison.length - 2] : null
  const variation = previousMonth && previousMonth.total > 0
    ? Math.round(((currentMonth.total - previousMonth.total) / previousMonth.total) * 100)
    : null

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">Total pago (6m)</p>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <p className="text-lg font-bold text-foreground sm:text-2xl">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">Contas (6m)</p>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <p className="text-lg font-bold text-foreground sm:text-2xl">{bills.length}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">Variacao mensal</p>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            {variation !== null ? (
              <p className={`text-lg font-bold sm:text-2xl ${variation > 0 ? "text-red-600" : variation < 0 ? "text-emerald-600" : "text-foreground"}`}>
                {variation > 0 ? "+" : ""}{variation}%
              </p>
            ) : (
              <p className="text-lg font-bold text-muted-foreground sm:text-2xl">--</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Smart messages */}
      <InsightsMessages messages={messages} />

      {/* Charts grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <InsightsCategoryChart data={categoryBreakdown} />
        <InsightsTopSuppliers data={topSuppliers} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InsightsPunctuality data={punctuality} />
        <InsightsForecast {...forecast} />
      </div>

      {/* Monthly breakdown table */}
      {monthlyComparison.some((m) => m.total > 0) && (
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">Evolucao mensal</p>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Mes</th>
                    <th className="pb-2 pr-4 text-right font-medium">Total</th>
                    <th className="pb-2 pr-4 text-right font-medium">Em dia</th>
                    <th className="pb-2 text-right font-medium">Pendente</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyComparison.map((m) => (
                    <tr key={`${m.year}-${m.month}`} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4 font-medium text-foreground">{m.label}</td>
                      <td className="py-2 pr-4 text-right text-foreground">{formatCurrency(m.total)}</td>
                      <td className="py-2 pr-4 text-right text-emerald-600">{formatCurrency(m.paidOnTime)}</td>
                      <td className="py-2 text-right text-amber-600">{formatCurrency(m.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default async function InsightsPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!session?.user?.name || !userId) {
    redirect("/onboarding")
  }

  const userIds = await getFamilyUserIds(userId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">Insights</h2>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">Voltar</Button>
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SectionSkeleton />
              <SectionSkeleton />
              <SectionSkeleton />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SectionSkeleton />
              <SectionSkeleton />
            </div>
          </div>
        }
      >
        <InsightsContent userIds={userIds} />
      </Suspense>
    </div>
  )
}
