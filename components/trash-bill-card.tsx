"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate, formatCategory } from "@/lib/format"
import { restoreBill } from "@/lib/actions"
import { toast } from "sonner"

interface TrashBillCardProps {
  bill: {
    id: string
    supplier: string
    amount: number
    dueDate: Date
    category: string
    deletedAt: Date | null
  }
}

export function TrashBillCard({ bill }: TrashBillCardProps) {
  const [isPending, startTransition] = useTransition()

  function handleRestore() {
    startTransition(async () => {
      try {
        await restoreBill(bill.id)
        toast.success(`"${bill.supplier}" restaurada!`)
      } catch {
        toast.error("Erro ao restaurar conta. Tente novamente.")
      }
    })
  }

  const daysLeft = bill.deletedAt
    ? Math.max(0, 30 - Math.floor((Date.now() - new Date(bill.deletedAt).getTime()) / 86400000))
    : 0

  return (
    <Card className="opacity-70">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate text-sm sm:text-base line-through">
              {bill.supplier}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
              <span>{formatDate(new Date(bill.dueDate))}</span>
              <span>·</span>
              <span>{formatCategory(bill.category)}</span>
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                Expira em {daysLeft}d
              </Badge>
            </div>
          </div>
          <p className="text-base font-semibold whitespace-nowrap shrink-0 text-muted-foreground line-through sm:text-lg">
            {formatCurrency(bill.amount)}
          </p>
        </div>
        <div className="mt-2 border-t pt-2 sm:mt-3 sm:pt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-11 min-w-[44px] text-xs sm:h-9 sm:text-sm"
            onClick={handleRestore}
            disabled={isPending}
          >
            {isPending ? "Restaurando..." : "Restaurar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
