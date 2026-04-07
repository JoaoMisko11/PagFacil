"use client"

import { useOptimistic, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import { CATEGORY_MAP } from "@/lib/constants"
import { markBillAsPaid, markBillAsPending } from "@/lib/actions"
import { toast } from "sonner"

interface BillCardProps {
  bill: {
    id: string
    supplier: string
    amount: number
    dueDate: Date
    category: string
    status: string
    notes: string | null
    isRecurring: boolean
    recurrenceFrequency?: string | null
  }
}

export function BillCard({ bill }: BillCardProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(bill.status)
  const [isPending, startTransition] = useTransition()

  const isPaid = optimisticStatus === "PAID"
  const isOverdue =
    optimisticStatus === "PENDING" && new Date(bill.dueDate) < new Date(new Date().toDateString())

  const borderColor = isPaid
    ? "border-l-green-500"
    : isOverdue
      ? "border-l-red-500"
      : "border-l-blue-500"

  function handleTogglePaid() {
    const wasPaid = isPaid
    if (!wasPaid && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(50)
    }
    startTransition(async () => {
      setOptimisticStatus(wasPaid ? "PENDING" : "PAID")
      try {
        if (wasPaid) {
          await markBillAsPending(bill.id)
          toast.success("Conta marcada como pendente")
        } else {
          const result = await markBillAsPaid(bill.id)
          toast.success(`"${bill.supplier}" marcada como paga!`)
          if (result.remainingPending === 0) {
            window.dispatchEvent(new Event("pagafacil:all-paid"))
          }
        }
      } catch {
        toast.error("Erro ao atualizar conta. Tente novamente.")
      }
    })
  }

  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border border-l-[3px] ${borderColor} bg-background p-2.5 text-sm shadow-sm transition-shadow hover:shadow-md ${isPaid ? "opacity-60" : ""}`}>
      <div className="min-w-0">
        <p className={`truncate font-medium ${isPaid ? "text-muted-foreground line-through" : ""}`}>
          {bill.supplier}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {CATEGORY_MAP[bill.category]?.icon} {CATEGORY_MAP[bill.category]?.label ?? bill.category}
          <span className="ml-1">· {formatDate(new Date(bill.dueDate))}</span>
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
        {isPaid ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2.5 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:hover:bg-amber-950 dark:hover:text-amber-400 dark:hover:border-amber-700 transition-colors"
            onClick={handleTogglePaid}
            disabled={isPending}
          >
            {isPending ? "..." : "↩ Desfazer"}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2.5 hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-950 dark:hover:text-green-400 dark:hover:border-green-700 transition-colors"
            onClick={handleTogglePaid}
            disabled={isPending}
          >
            {isPending ? "..." : "✓ Paga"}
          </Button>
        )}
      </div>
    </div>
  )
}
