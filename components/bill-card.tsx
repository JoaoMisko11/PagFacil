"use client"

import { useState, useOptimistic, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import { CATEGORY_MAP } from "@/lib/constants"
import { markBillAsPaid, markBillAsPending, deleteBill } from "@/lib/actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useDisplayMode } from "@/components/display-mode-provider"

const frequencyLabels: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
}

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

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pendente", variant: "outline" },
  PAID: { label: "Paga", variant: "default" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
}

export function BillCard({ bill }: BillCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(bill.status)
  const [isPending, startTransition] = useTransition()
  const { mode } = useDisplayMode()
  const compact = mode === "compact"

  const isPaid = optimisticStatus === "PAID"
  const isOverdue =
    optimisticStatus === "PENDING" && new Date(bill.dueDate) < new Date(new Date().toDateString())
  const status = isOverdue ? "OVERDUE" : optimisticStatus
  const { label, variant } = statusConfig[status] ?? statusConfig.PENDING

  function handleTogglePaid() {
    const wasPaid = isPaid
    // Haptic feedback ao marcar como paga (PWA)
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

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteBill(bill.id)
      toast.success("Conta deletada")
      setDialogOpen(false)
    } catch {
      toast.error("Erro ao deletar conta. Tente novamente.")
      setDeleting(false)
    }
  }

  return (
    <Card className={isPaid ? "opacity-60" : ""}>
      <CardContent className={compact ? "p-2 sm:p-3" : "p-3 sm:p-4"}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={`font-medium truncate ${compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"} ${isPaid ? "line-through" : ""}`}>
                {bill.supplier}
              </p>
              {bill.isRecurring && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">
                  {frequencyLabels[bill.recurrenceFrequency ?? "MONTHLY"] ?? "Mensal"}
                </Badge>
              )}
            </div>
            <div className={`mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground ${compact ? "" : "sm:gap-2 sm:text-sm"}`}>
              <span>{formatDate(new Date(bill.dueDate))}</span>
              <span>·</span>
              <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium ${compact ? "" : "sm:text-xs"} ${CATEGORY_MAP[bill.category]?.color ?? ""}`}>
                {CATEGORY_MAP[bill.category]?.icon} {CATEGORY_MAP[bill.category]?.label ?? bill.category}
              </span>
              <Badge variant={variant} className="text-[10px] sm:text-xs">
                {label}
              </Badge>
            </div>
          </div>

          <p className={`font-semibold whitespace-nowrap shrink-0 ${compact ? "text-sm sm:text-base" : "text-base sm:text-lg"} ${isPaid ? "line-through text-muted-foreground" : ""}`}>
            {formatCurrency(bill.amount)}
          </p>
        </div>

        <div className={`flex gap-1 border-t ${compact ? "mt-1.5 pt-1.5" : "mt-2 pt-2 sm:mt-3 sm:pt-3"}`}>
          <Button
            variant="ghost"
            size="sm"
            className={`${compact ? "h-8 min-w-[36px]" : "h-11 min-w-[44px]"} flex-1 text-xs sm:h-9 sm:flex-none sm:text-sm`}
            onClick={handleTogglePaid}
            disabled={isPending}
          >
            {isPaid ? "↩ Desfazer" : "✓ Paga"}
          </Button>

          <Link href={`/bills/${bill.id}/edit`} className="flex-1 sm:flex-none">
            <Button variant="ghost" size="sm" className={`${compact ? "h-8 min-w-[36px]" : "h-11 min-w-[44px]"} w-full text-xs sm:h-9 sm:text-sm`}>
              ✏️ Editar
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className={`${compact ? "h-8 min-w-[36px]" : "h-11 min-w-[44px]"} flex-1 text-xs text-destructive hover:text-destructive sm:h-9 sm:flex-none sm:text-sm`}
            onClick={() => setDialogOpen(true)}
          >
            🗑 Deletar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Deletar conta</DialogTitle>
                <DialogDescription>
                  Tem certeza que quer deletar &quot;{bill.supplier}&quot; — {formatCurrency(bill.amount)}?
                  Essa ação pode ser desfeita em até 30 dias.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deletando..." : "Deletar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
