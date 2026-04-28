"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Check, Loader2, X } from "lucide-react"
import { confirmTransactionMatch, ignoreTransactionMatch } from "@/lib/bank-actions"
import { formatCurrency, formatDate } from "@/lib/format"

interface MatchSuggestionCardProps {
  transaction: {
    id: string
    amount: number
    date: Date
    description: string
    matchScore: number | null
  }
  bill: {
    id: string
    supplier: string
    amount: number
    dueDate: Date
  }
}

export function MatchSuggestionCard({ transaction, bill }: MatchSuggestionCardProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await confirmTransactionMatch(transaction.id)
      if ("error" in result) setError(result.error)
      else setHidden(true)
    })
  }

  function handleIgnore() {
    setError(null)
    startTransition(async () => {
      const result = await ignoreTransactionMatch(transaction.id)
      if ("error" in result) setError(result.error)
      else setHidden(true)
    })
  }

  if (hidden) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
        Possível pagamento detectado{transaction.matchScore !== null ? ` · ${transaction.matchScore}% de confiança` : ""}
      </div>

      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-3">
          <div className="text-xs uppercase text-muted-foreground">Conta a pagar</div>
          <div className="mt-1 font-semibold">{bill.supplier}</div>
          <div className="text-sm text-muted-foreground">
            Vence {formatDate(bill.dueDate)} · {formatCurrency(bill.amount)}
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <div className="text-xs uppercase text-muted-foreground">Transação</div>
          <div className="mt-1 line-clamp-1 font-medium">{transaction.description}</div>
          <div className="text-sm text-muted-foreground">
            {formatDate(transaction.date)} · {formatCurrency(Math.abs(transaction.amount))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={isPending}
          className="gap-1.5"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Confirmar pagamento
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleIgnore}
          disabled={isPending}
          className="gap-1.5"
        >
          <X className="h-4 w-4" />
          Não é esta conta
        </Button>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
