"use client"

import { useState, useOptimistic, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate, formatCategory } from "@/lib/format"
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

  const isPaid = optimisticStatus === "PAID"
  const isOverdue =
    optimisticStatus === "PENDING" && new Date(bill.dueDate) < new Date(new Date().toDateString())
  const status = isOverdue ? "OVERDUE" : optimisticStatus
  const { label, variant } = statusConfig[status] ?? statusConfig.PENDING

  function handleTogglePaid() {
    const wasPaid = isPaid
    startTransition(async () => {
      setOptimisticStatus(wasPaid ? "PENDING" : "PAID")
      try {
        if (wasPaid) {
          await markBillAsPending(bill.id)
          toast.success("Conta marcada como pendente")
        } else {
          await markBillAsPaid(bill.id)
          toast.success(`"${bill.supplier}" marcada como paga!`)
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
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={`font-medium truncate text-sm sm:text-base ${isPaid ? "line-through" : ""}`}>
                {bill.supplier}
              </p>
              {bill.isRecurring && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">
                  {frequencyLabels[bill.recurrenceFrequency ?? "MONTHLY"] ?? "Mensal"}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
              <span>{formatDate(new Date(bill.dueDate))}</span>
              <span>·</span>
              <span>{formatCategory(bill.category)}</span>
              <Badge variant={variant} className="text-[10px] sm:text-xs">
                {label}
              </Badge>
            </div>
          </div>

          <p className={`text-base font-semibold whitespace-nowrap shrink-0 sm:text-lg ${isPaid ? "line-through text-muted-foreground" : ""}`}>
            {formatCurrency(bill.amount)}
          </p>
        </div>

        <div className="mt-2 flex gap-1 border-t pt-2 sm:mt-3 sm:pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-11 min-w-[44px] flex-1 text-xs sm:h-9 sm:flex-none sm:text-sm"
            onClick={handleTogglePaid}
            disabled={isPending}
          >
            {isPaid ? "↩ Desfazer" : "✓ Paga"}
          </Button>

          <Link href={`/bills/${bill.id}/edit`} className="flex-1 sm:flex-none">
            <Button variant="ghost" size="sm" className="h-11 w-full min-w-[44px] text-xs sm:h-9 sm:text-sm">
              ✏️ Editar
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className="h-11 min-w-[44px] flex-1 text-xs text-destructive hover:text-destructive sm:h-9 sm:flex-none sm:text-sm"
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
