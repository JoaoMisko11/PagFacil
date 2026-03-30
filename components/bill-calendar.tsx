"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatCategory } from "@/lib/format"
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

  const today = new Date(new Date().toISOString().split("T")[0] + "T00:00:00Z")

  // Dots coloridos: datas com contas
  const overdueDates: Date[] = []
  const todayDates: Date[] = []
  const upcomingDates: Date[] = []

  for (const [dateStr] of billsByDay) {
    const d = new Date(dateStr + "T00:00:00Z")
    if (d < today) overdueDates.push(d)
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
    ? selectedDate.toISOString().split("T")[0]
    : undefined
  const selectedBills = selectedKey ? billsByDay.get(selectedKey) ?? [] : []

  const handleDayClick: DayMouseEventHandler = (day) => {
    setSelectedDate(day)
  }

  return (
    <Card>
      <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
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
            }}
            modifiersClassNames={{
              overdue: "bill-dot-red",
              dueToday: "bill-dot-amber",
              upcoming: "bill-dot-blue",
            }}
          />
        </div>

        {/* Totais do mês */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          {totalPending > 0 && (
            <span className="rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              Pendente: {formatCurrency(totalPending)}
            </span>
          )}
          {totalPaid > 0 && (
            <span className="rounded-md bg-green-50 px-2 py-1 font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
              Pago: {formatCurrency(totalPaid)}
            </span>
          )}
          {totalPending === 0 && totalPaid === 0 && (
            <span className="text-muted-foreground">Nenhuma conta neste mês</span>
          )}
        </div>

        {/* Legenda */}
        <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            Vencida
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            Hoje
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            A vencer
          </span>
        </div>

        {/* Contas do dia selecionado */}
        {selectedDate && (
          <div className="mt-3 border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {selectedDate.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "UTC",
              })}
            </p>
            {selectedBills.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma conta neste dia.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedBills.map((bill) => {
                  const isOverdue =
                    bill.status === "PENDING" &&
                    new Date(bill.dueDate) < today
                  return (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{bill.supplier}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCategory(bill.category)}
                          {bill.isRecurring && " · Recorrente"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold">
                          {formatCurrency(bill.amount)}
                        </span>
                        <Badge
                          variant={
                            bill.status === "PAID"
                              ? "default"
                              : isOverdue
                                ? "destructive"
                                : "outline"
                          }
                          className="text-[10px]"
                        >
                          {bill.status === "PAID"
                            ? "Paga"
                            : isOverdue
                              ? "Vencida"
                              : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
