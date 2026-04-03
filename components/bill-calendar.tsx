"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import { CATEGORY_MAP } from "@/lib/constants"
import { markBillAsPaid } from "@/lib/actions"
import { toast } from "sonner"
import { ptBR } from "date-fns/locale"
import type { DayMouseEventHandler } from "react-day-picker"

interface CalendarBill {
  id: string
  supplier: string
  amount: number
  dueDate: string // ISO string
  category: string
  status: string
  isRecurring: boolean
}

interface BillCalendarProps {
  bills: CalendarBill[]
}

export function BillCalendar({ bills }: BillCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [viewMonth, setViewMonth] = useState<Date>(new Date())

  // Agrupa contas por dia (YYYY-MM-DD)
  const billsByDay = new Map<string, CalendarBill[]>()
  for (const bill of bills) {
    const key = bill.dueDate.split("T")[0]
    const existing = billsByDay.get(key) ?? []
    existing.push(bill)
    billsByDay.set(key, existing)
  }

  const today = new Date(new Date().toLocaleDateString("en-CA") + "T00:00:00")

  // Dots coloridos: datas com contas
  const overdueDates: Date[] = []
  const todayDates: Date[] = []
  const upcomingDates: Date[] = []
  const paidDates: Date[] = []

  for (const [dateStr, dayBills] of billsByDay) {
    const d = new Date(dateStr + "T00:00:00")
    const allPaid = dayBills.every((b) => b.status === "PAID")
    if (allPaid) paidDates.push(d)
    else if (d < today) overdueDates.push(d)
    else if (d.getTime() === today.getTime()) todayDates.push(d)
    else upcomingDates.push(d)
  }

  // Totais do mês visualizado
  const viewYear = viewMonth.getFullYear()
  const viewMo = viewMonth.getMonth()
  const monthBills = bills.filter((b) => {
    const d = new Date(b.dueDate)
    return d.getFullYear() === viewYear && d.getMonth() === viewMo
  })
  const totalPending = monthBills
    .filter((b) => b.status === "PENDING" || b.status === "OVERDUE")
    .reduce((sum, b) => sum + b.amount, 0)
  const totalPaid = monthBills
    .filter((b) => b.status === "PAID")
    .reduce((sum, b) => sum + b.amount, 0)

  const selectedKey = selectedDate
    ? selectedDate.toLocaleDateString("en-CA")
    : undefined
  const selectedBills = selectedKey ? billsByDay.get(selectedKey) ?? [] : []

  const handleDayClick: DayMouseEventHandler = (day) => {
    setSelectedDate(day)
  }

  // Contagem de contas por dia para o badge
  const billCountByDay = new Map<string, number>()
  for (const [dateStr, dateBills] of billsByDay) {
    billCountByDay.set(dateStr, dateBills.length)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Calendário
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 sm:pt-0">
        <div className="flex justify-center">
          <Calendar
            locale={ptBR}
            mode="single"
            selected={selectedDate}
            onDayClick={handleDayClick}
            onMonthChange={setViewMonth}
            modifiers={{
              overdue: overdueDates,
              dueToday: todayDates,
              upcoming: upcomingDates,
              paid: paidDates,
            }}
            modifiersClassNames={{
              overdue: "bill-dot-red",
              dueToday: "bill-dot-amber",
              upcoming: "bill-dot-blue",
              paid: "bill-dot-green",
            }}
          />
        </div>

        {/* Totais do mês — visual melhorado */}
        <div className="mt-3 flex items-center justify-center gap-3 text-xs">
          {totalPending > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {formatCurrency(totalPending)}
            </div>
          )}
          {totalPaid > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400 border border-green-200/50 dark:border-green-800/30">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {formatCurrency(totalPaid)}
            </div>
          )}
          {totalPending === 0 && totalPaid === 0 && (
            <span className="text-muted-foreground italic">Nenhuma conta neste mês</span>
          )}
        </div>

        {/* Legenda — melhorada com glow */}
        <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
            Paga
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
            Vencida
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
            Hoje
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]" />
            A vencer
          </span>
        </div>

        {/* Contas do dia selecionado — visual card */}
        {selectedDate && (
          <div className="calendar-detail-enter mt-4 rounded-lg border bg-muted/30 p-3">
            <div className="mb-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold capitalize">
                  {selectedDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    timeZone: "UTC",
                  })}
                </p>
                {selectedBills.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedBills.length} {selectedBills.length === 1 ? "conta" : "contas"} · {formatCurrency(selectedBills.reduce((s, b) => s + b.amount, 0))}
                  </p>
                )}
              </div>
              <Link href={`/bills/new?date=${selectedKey}`}>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-dashed">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Criar
                </Button>
              </Link>
            </div>
            {selectedBills.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                Nenhuma conta neste dia
              </p>
            ) : (
              <div className="space-y-2">
                {selectedBills.map((bill) => (
                  <CalendarBillItem key={bill.id} bill={bill} today={today} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CalendarBillItem({ bill, today }: { bill: CalendarBill; today: Date }) {
  const [isPending, startTransition] = useTransition()
  const isOverdue = bill.status === "PENDING" && new Date(bill.dueDate) < today
  const isPaid = bill.status === "PAID"
  const canMarkPaid = !isPaid

  const borderColor = isPaid
    ? "border-l-green-500"
    : isOverdue
      ? "border-l-red-500"
      : "border-l-blue-500"

  function handleMarkPaid() {
    startTransition(async () => {
      try {
        const result = await markBillAsPaid(bill.id)
        toast.success(`"${bill.supplier}" marcada como paga!`)
        if (result.remainingPending === 0) {
          window.dispatchEvent(new Event("pagafacil:all-paid"))
        }
      } catch {
        toast.error("Erro ao marcar como paga.")
      }
    })
  }

  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border border-l-[3px] ${borderColor} bg-background p-2.5 text-sm shadow-sm transition-shadow hover:shadow-md`}>
      <div className="min-w-0">
        <p className={`truncate font-medium ${isPaid ? "text-muted-foreground line-through" : ""}`}>
          {bill.supplier}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {CATEGORY_MAP[bill.category]?.icon} {CATEGORY_MAP[bill.category]?.label ?? bill.category}
          {bill.isRecurring && (
            <span className="ml-1 inline-flex items-center gap-0.5">
              · <svg className="h-3 w-3 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-semibold tabular-nums ${isPaid ? "text-muted-foreground" : ""}`}>
          {formatCurrency(bill.amount)}
        </span>
        {canMarkPaid ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] px-2.5 hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-950 dark:hover:text-green-400 dark:hover:border-green-700 transition-colors"
            onClick={handleMarkPaid}
            disabled={isPending}
          >
            {isPending ? "..." : "✓ Paga"}
          </Button>
        ) : (
          <Badge variant="default" className="text-[10px] bg-green-600">✓ Paga</Badge>
        )}
      </div>
    </div>
  )
}
