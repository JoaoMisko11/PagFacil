import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { cache } from "react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/format"
import { BillCard } from "@/components/bill-card"
import { BillCalendar } from "@/components/bill-calendar"
import { TrendChart } from "@/components/trend-chart"
import { OnboardingChecklist } from "@/components/onboarding-checklist"
import { SmartInsights } from "@/components/smart-insights"

// Cached queries — deduplicadas dentro do mesmo request
const getPendingBills = cache(async (userId: string) => {
  return db.bill.findMany({
    where: { userId, deletedAt: null, status: "PENDING" },
    orderBy: { dueDate: "asc" },
  })
})

const getAllBills = cache(async (userId: string) => {
  return db.bill.findMany({
    where: { userId, deletedAt: null },
    orderBy: { dueDate: "asc" },
    select: {
      id: true,
      supplier: true,
      amount: true,
      dueDate: true,
      category: true,
      status: true,
      isRecurring: true,
    },
  })
})

// --- Skeleton fallbacks ---

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CalendarSkeleton() {
  return (
    <Card>
      <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent className="p-2 sm:p-4 sm:pt-0">
        <Skeleton className="mx-auto h-64 w-full max-w-xs" />
      </CardContent>
    </Card>
  )
}

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

// --- Async streamed components ---

async function SummaryCards({ userId }: { userId: string }) {
  const pendingBills = await getPendingBills(userId)

  const now = new Date()
  const today = new Date(now.toISOString().split("T")[0] + "T00:00:00Z")
  const endOfWeek = new Date(today)
  endOfWeek.setDate(endOfWeek.getDate() + 7)
  const endOf30Days = new Date(today)
  endOf30Days.setDate(endOf30Days.getDate() + 30)

  const overdue = pendingBills.filter((b) => b.dueDate < today)
  const dueToday = pendingBills.filter((b) => {
    const tomorrow = new Date(today.getTime() + 86400000)
    return b.dueDate >= today && b.dueDate < tomorrow
  })

  const totalWeek = pendingBills
    .filter((b) => b.dueDate <= endOfWeek)
    .reduce((sum, b) => sum + b.amount, 0)

  const totalMonth = pendingBills
    .filter((b) => b.dueDate <= endOf30Days)
    .reduce((sum, b) => sum + b.amount, 0)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <Card>
        <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
          <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
            <span className="text-base">&#128197;</span>
            Pendente semana
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
          <p className="text-lg font-bold text-foreground sm:text-2xl">{formatCurrency(totalWeek)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
          <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
            <span className="text-base">&#128198;</span>
            Pendente 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
          <p className="text-lg font-bold text-foreground sm:text-2xl">{formatCurrency(totalMonth)}</p>
        </CardContent>
      </Card>
      <Card className={overdue.length > 0 ? "border-destructive bg-destructive/5" : ""}>
        <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
          <CardTitle className="flex items-center gap-1.5 text-xs font-medium sm:text-sm text-muted-foreground">
            <span className="text-base">&#9888;&#65039;</span>
            Vencidas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
          <p className={`text-lg font-bold sm:text-2xl ${overdue.length > 0 ? "text-destructive" : "text-foreground"}`}>
            {overdue.length}
          </p>
        </CardContent>
      </Card>
      <Card className={dueToday.length > 0 ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : ""}>
        <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
          <CardTitle className="flex items-center gap-1.5 text-xs font-medium sm:text-sm text-muted-foreground">
            <span className="text-base">&#9203;</span>
            Vencem hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
          <p className={`text-lg font-bold sm:text-2xl ${dueToday.length > 0 ? "text-amber-600" : "text-foreground"}`}>
            {dueToday.length}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function TrendChartSkeleton() {
  return (
    <Card>
      <CardHeader className="p-3 pb-0 sm:p-4 sm:pb-0">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="p-3 pt-2 sm:p-4 sm:pt-2">
        <Skeleton className="h-28 w-full" />
        <div className="mt-2 flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  )
}

// --- Async streamed components ---

async function ChecklistSection({ userId }: { userId: string }) {
  const [user, billCount, paidCount, recurringCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { notifyVia: true },
    }),
    db.bill.count({ where: { userId, deletedAt: null } }),
    db.bill.count({ where: { userId, deletedAt: null, status: "PAID" } }),
    db.bill.count({ where: { userId, deletedAt: null, isRecurring: true } }),
  ])

  const items = [
    { label: "Configurar lembretes", done: !!user?.notifyVia, href: "/settings" },
    { label: "Cadastrar 3 contas", done: billCount >= 3, href: "/bills/new" },
    { label: "Marcar 1 conta como paga", done: paidCount >= 1, href: "/bills" },
    { label: "Criar conta recorrente", done: recurringCount >= 1, href: "/bills/new" },
  ]

  const allDone = items.every((i) => i.done)
  if (allDone) return null

  return <OnboardingChecklist items={items} />
}

async function PunctualityStreak({ userId }: { userId: string }) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const paidThisMonth = await db.bill.findMany({
    where: {
      userId,
      deletedAt: null,
      status: "PAID",
      paidAt: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { paidAt: true, dueDate: true },
  })

  const onTimeCount = paidThisMonth.filter(
    (b) => b.paidAt && b.paidAt <= new Date(b.dueDate.getTime() + 86400000)
  ).length

  if (onTimeCount === 0) return null

  const messages = [
    { min: 1, icon: "✨", text: `${onTimeCount} conta${onTimeCount > 1 ? "s" : ""} paga${onTimeCount > 1 ? "s" : ""} em dia esse mês!` },
    { min: 3, icon: "🔥", text: `${onTimeCount} contas pagas em dia! Bom ritmo!` },
    { min: 5, icon: "⭐", text: `${onTimeCount} contas pagas em dia esse mês! Continue assim!` },
    { min: 10, icon: "🏆", text: `${onTimeCount} contas pagas em dia! Você é referência!` },
  ]

  const message = [...messages].reverse().find((m) => onTimeCount >= m.min)!

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
      <span className="text-lg">{message.icon}</span>
      <span className="font-medium text-foreground">{message.text}</span>
    </div>
  )
}

async function InsightsSection({ userId }: { userId: string }) {
  const insights: { type: "pattern" | "tip"; message: string }[] = []

  // Padrão: contas recorrentes que o usuário costuma pagar
  const recurringPaid = await db.bill.findMany({
    where: {
      userId,
      deletedAt: null,
      isRecurring: true,
      status: "PAID",
    },
    select: { supplier: true, amount: true, dueDate: true },
    orderBy: { paidAt: "desc" },
    take: 20,
  })

  // Agrupa por fornecedor e calcula dia médio de vencimento
  const supplierStats = new Map<string, { count: number; totalAmount: number; days: number[] }>()
  for (const bill of recurringPaid) {
    const stats = supplierStats.get(bill.supplier) ?? { count: 0, totalAmount: 0, days: [] }
    stats.count++
    stats.totalAmount += bill.amount
    stats.days.push(new Date(bill.dueDate).getUTCDate())
    supplierStats.set(bill.supplier, stats)
  }

  for (const [supplier, stats] of supplierStats) {
    if (stats.count >= 2) {
      const avgDay = Math.round(stats.days.reduce((a, b) => a + b, 0) / stats.days.length)
      const avgAmount = Math.round(stats.totalAmount / stats.count)
      insights.push({
        type: "pattern",
        message: `"${supplier}" vence por volta do dia ${avgDay} (${formatCurrency(avgAmount)} em media).`,
      })
    }
  }

  // Dica: contas vencidas sem pagar
  const overdueCount = await db.bill.count({
    where: {
      userId,
      deletedAt: null,
      status: "PENDING",
      dueDate: { lt: new Date(new Date().toISOString().split("T")[0] + "T00:00:00Z") },
    },
  })

  if (overdueCount > 0) {
    insights.push({
      type: "tip",
      message: `Voce tem ${overdueCount} conta${overdueCount > 1 ? "s" : ""} vencida${overdueCount > 1 ? "s" : ""}. Regularize para manter o controle em dia.`,
    })
  }

  if (insights.length === 0) return null
  return <SmartInsights insights={insights.slice(0, 3)} />
}

async function TrendSection({ userId }: { userId: string }) {
  const now = new Date()
  const months: { label: string; paid: number; pending: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

    const [paidAgg, pendingAgg] = await Promise.all([
      db.bill.aggregate({
        where: {
          userId,
          deletedAt: null,
          status: "PAID",
          paidAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      db.bill.aggregate({
        where: {
          userId,
          deletedAt: null,
          status: { in: ["PENDING", "PAID"] },
          dueDate: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
    ])

    const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
    months.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      paid: paidAgg._sum.amount ?? 0,
      pending: pendingAgg._sum.amount ?? 0,
    })
  }

  const hasData = months.some((m) => m.paid > 0 || m.pending > 0)
  if (!hasData) return null

  return <TrendChart data={months} />
}

async function CalendarSection({ userId }: { userId: string }) {
  const allBills = await getAllBills(userId)
  const calendarBills = allBills.map((b) => ({
    ...b,
    dueDate: b.dueDate.toISOString(),
  }))
  return <BillCalendar bills={calendarBills} />
}

async function BillsSection({ userId }: { userId: string }) {
  const pendingBills = await getPendingBills(userId)

  // Check if user has paid bills this month (for celebratory empty state)
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
  const tomorrow = new Date(today.getTime() + 86400000)
  const endOfWeek = new Date(today)
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  const overdue = pendingBills.filter((b) => b.dueDate < today)
  const dueToday = pendingBills.filter(
    (b) => b.dueDate >= today && b.dueDate < tomorrow
  )
  const dueThisWeek = pendingBills.filter(
    (b) => b.dueDate >= tomorrow && b.dueDate <= endOfWeek
  )

  return (
    <>
      {/* Vencidas */}
      {overdue.length > 0 && (
        <section>
          <h3 className="mb-2 text-base font-semibold text-destructive sm:text-lg">
            Vencidas ({overdue.length})
          </h3>
          <div className="space-y-2">
            {overdue.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        </section>
      )}

      {/* Hoje */}
      {dueToday.length > 0 && (
        <section>
          <h3 className="mb-2 text-base font-semibold text-amber-600 sm:text-lg">
            Vencem hoje ({dueToday.length})
          </h3>
          <div className="space-y-2">
            {dueToday.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        </section>
      )}

      {/* Próximos 7 dias */}
      {dueThisWeek.length > 0 && (
        <section>
          <h3 className="mb-2 text-base font-semibold text-primary sm:text-lg">
            Próximos 7 dias ({dueThisWeek.length})
          </h3>
          <div className="space-y-2">
            {dueThisWeek.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        </section>
      )}

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

      {/* Contas futuras (após 7 dias) */}
      {pendingBills.length > 0 && overdue.length === 0 && dueToday.length === 0 && dueThisWeek.length === 0 && (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          <p className="text-sm">
            Suas {pendingBills.length} conta{pendingBills.length > 1 ? "s" : ""} pendente{pendingBills.length > 1 ? "s" : ""} vencem após os próximos 7 dias.
          </p>
        </div>
      )}

      {/* Link para ver todas */}
      {pendingBills.length > 0 && (
        <div className="text-center">
          <Link href="/bills">
            <Button variant="outline" className="h-11">Ver todas as contas</Button>
          </Link>
        </div>
      )}
    </>
  )
}

// --- Greeting helpers ---

function getGreeting(): string {
  const hour = new Date().toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hour12: false,
  })
  const h = parseInt(hour, 10)
  if (h >= 5 && h < 12) return "Bom dia"
  if (h >= 12 && h < 18) return "Boa tarde"
  return "Boa noite"
}

function getDayContext(): string {
  const dayOfWeek = new Date().toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
  })
  const dayMessages: Record<string, string> = {
    Monday: "Começo de semana — bora organizar as contas!",
    Tuesday: "Aqui está o resumo das suas contas a pagar.",
    Wednesday: "Metade da semana! Confira suas contas.",
    Thursday: "Quase sexta! Veja o que ainda precisa pagar.",
    Friday: "Sextou! Deixe as contas em dia pro fim de semana.",
    Saturday: "Bom descanso! Aqui está o resumo das suas contas.",
    Sunday: "Domingo tranquilo. Confira suas contas para a semana.",
  }
  return dayMessages[dayOfWeek] ?? "Aqui está o resumo das suas contas a pagar."
}

// --- Main page ---

export default async function DashboardPage() {
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
            {getGreeting()}, {session.user.name}!
          </h2>
          <p className="text-sm text-muted-foreground">
            {getDayContext()}
          </p>
        </div>
        <Link href="/bills/new" className="shrink-0">
          <Button size="sm" className="sm:size-default">+ Nova Conta</Button>
        </Link>
      </div>

      <Suspense fallback={null}>
        <ChecklistSection userId={userId} />
      </Suspense>

      <Suspense fallback={<SummaryCardsSkeleton />}>
        <SummaryCards userId={userId} />
      </Suspense>

      <Suspense fallback={null}>
        <PunctualityStreak userId={userId} />
      </Suspense>

      <Suspense fallback={null}>
        <InsightsSection userId={userId} />
      </Suspense>

      <Suspense fallback={<TrendChartSkeleton />}>
        <TrendSection userId={userId} />
      </Suspense>

      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarSection userId={userId} />
      </Suspense>

      <Suspense fallback={<BillsSkeleton />}>
        <BillsSection userId={userId} />
      </Suspense>
    </div>
  )
}
