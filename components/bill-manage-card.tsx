"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import { CATEGORY_MAP } from "@/lib/constants"
import { deleteBill } from "@/lib/actions"
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

interface BillManageCardProps {
  supplier: string
  category: string
  amount: number
  isRecurring: boolean
  recurrenceFrequency?: string | null
  /** ID da próxima conta pendente (para editar) */
  nextPendingId?: string
  /** ID de qualquer instância (para editar se não tem pendente) */
  anyId: string
  /** Próximo vencimento */
  nextDueDate?: Date | null
}

export function BillManageCard({
  supplier,
  category,
  amount,
  isRecurring,
  recurrenceFrequency,
  nextPendingId,
  anyId,
  nextDueDate,
}: BillManageCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const editId = nextPendingId ?? anyId
  const cat = CATEGORY_MAP[category]

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteBill(editId)
      toast.success(`"${supplier}" deletada`)
      setDialogOpen(false)
    } catch {
      toast.error("Erro ao deletar. Tente novamente.")
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium sm:text-base">
                {supplier}
              </p>
              {isRecurring && (
                <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
                  {frequencyLabels[recurrenceFrequency ?? "MONTHLY"]}
                </Badge>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
              <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium sm:text-xs ${cat?.color ?? ""}`}>
                {cat?.icon} {cat?.label ?? category}
              </span>
              {nextDueDate && (
                <>
                  <span>·</span>
                  <span>Próx: {formatDate(new Date(nextDueDate))}</span>
                </>
              )}
            </div>
          </div>

          <p className="shrink-0 whitespace-nowrap text-base font-semibold sm:text-lg">
            {formatCurrency(amount)}
          </p>
        </div>

        <div className="mt-2 flex gap-1 border-t pt-2 sm:mt-3 sm:pt-3">
          <Link href={`/bills/${editId}/edit`} className="flex-1 sm:flex-none">
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
                  Tem certeza que quer deletar &quot;{supplier}&quot; — {formatCurrency(amount)}?
                  {isRecurring && " Isso remove a próxima instância pendente."}
                  {" "}Essa ação pode ser desfeita em até 30 dias.
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
