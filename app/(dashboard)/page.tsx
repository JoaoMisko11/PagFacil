import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { BillCard } from "@/components/bill-card"
import { BillCalendar } from "@/components/bill-calendar"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id

  // Redireciona usuários novos (sem nome) para onboarding
  if (!session?.user?.name) {
    redirect("/onboarding")
  }

  const now = new Date()
  const today = new Date(now.toISOString().split("T")[0] + "T00:00:00Z")
  const tomorrow = new Date(today.getTime() + 86400000)
  const endOfWeek = new Date(today)
  endOfWeek.setDate(endOfWeek.getDate() + 7)
  const endOf30Days = new Date(today)
  endOf30Days.setDate(endOf30Days.getDate() + 30)

  const pendingBills = await db.bill.findMany({
    where: {
      userId,
      deletedAt: null,
      status: "PENDING",
    },
    orderBy: { dueDate: "asc" },
  })

  // Todas as contas (incluindo pagas) para o calendário
  const allBills = await db.bill.findMany({
    where: {
      userId,
      deletedAt: null,
    },
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

  const calendarBills = allBills.map((b) => ({
    ...b,
    dueDate: b.dueDate.toISOString(),
  }))

  const overdue = pendingBills.filter((b) => b.dueDate < today)
  const dueToday = pendingBills.filter(
    (b) => b.dueDate >= today && b.dueDate < tomorrow
  )
  const dueThisWeek = pendingBills.filter(
    (b) => b.dueDate >= tomorrow && b.dueDate <= endOfWeek
  )

  const totalWeek = pendingBills
    .filter((b) => b.dueDate <= endOfWeek)
    .reduce((sum, b) => sum + b.amount, 0)

  const totalMonth = pendingBills
    .filter((b) => b.dueDate <= endOf30Days)
    .reduce((sum, b) => sum + b.amount, 0)

  const totalBills = pendingBills.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Olá, {session?.user?.name ?? "bem-vindo"}!
          </h2>
          <p className="text-sm text-muted-foreground">
            Aqui está o resumo das suas contas a pagar.
          </p>
        </div>
        <Link href="/bills/new" className="shrink-0">
          <Button size="sm" className="sm:size-default">+ Nova Conta</Button>
        </Link>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              Pendente semana
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <p className="text-lg font-bold text-foreground sm:text-2xl">{formatCurrency(totalWeek)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              Pendente 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <p className="text-lg font-bold text-foreground sm:text-2xl">{formatCurrency(totalMonth)}</p>
          </CardContent>
        </Card>
        <Card className={overdue.length > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <p className={`text-lg font-bold sm:text-2xl ${overdue.length > 0 ? "text-destructive" : "text-foreground"}`}>
              {overdue.length}
            </p>
          </CardContent>
        </Card>
        <Card className={dueToday.length > 0 ? "border-amber-400/50" : ""}>
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
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

      {/* Calendário */}
      <BillCalendar bills={calendarBills} />

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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <span className="text-3xl">&#10003;</span>
          </div>
          <p className="text-lg font-semibold text-foreground">Tudo em dia!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhuma conta pendente no momento. Cadastre uma nova conta quando precisar.
          </p>
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
    </div>
  )
}
