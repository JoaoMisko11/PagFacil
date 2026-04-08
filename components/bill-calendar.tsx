"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
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
  selectedDate?: string // YYYY-MM-DD from URL
}

export function BillCalendar({ bills, selectedDate }: BillCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [viewMonth, setViewMonth] = useState<Date>(
    selectedDate ? new Date(selectedDate + "T00:00:00") : new Date()
  )

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

  const selectedDateObj = selectedDate
    ? new Date(selectedDate + "T00:00:00")
    : undefined

  const handleDayClick: DayMouseEventHandler = (day) => {
    const dateStr = day.toLocaleDateString("en-CA")
    const params = new URLSearchParams(searchParams.toString())

    // Toggle: clicar na mesma data limpa o filtro
    if (selectedDate === dateStr) {
      params.delete("date")
    } else {
      params.set("date", dateStr)
      // Limpa tab ao filtrar por data
      params.delete("tab")
    }

    startTransition(() => {
      router.push(`/pagamentos?${params.toString()}`)
    })
  }

  return (
    <Card className={`overflow-hidden transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Calendario
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-4 sm:pt-0">
        <div className="flex justify-center">
          <Calendar
            locale={ptBR}
            mode="single"
            selected={selectedDateObj}
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

        {/* Totais do mês */}
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
            <span className="text-muted-foreground italic">Nenhuma conta neste mes</span>
          )}
        </div>

        {/* Legenda */}
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
      </CardContent>
    </Card>
  )
}
