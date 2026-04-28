"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Trash2 } from "lucide-react"
import { removeBankConnection, triggerBankSync } from "@/lib/bank-actions"
import { formatCurrency } from "@/lib/format"
import type { BankAccountType } from "@prisma/client"

interface BankAccount {
  id: string
  type: BankAccountType
  name: string
  number: string | null
  balance: number
}

interface BankConnectionCardProps {
  connection: {
    id: string
    bankName: string
    bankImageUrl: string | null
    status: string
    lastSyncAt: Date | null
    accounts: BankAccount[]
  }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  UPDATED: { label: "Sincronizado", color: "text-green-600" },
  UPDATING: { label: "Sincronizando…", color: "text-blue-600" },
  WAITING_USER_INPUT: { label: "Ação necessária", color: "text-amber-600" },
  WAITING_USER_ACTION: { label: "Ação necessária", color: "text-amber-600" },
  LOGIN_ERROR: { label: "Erro no login", color: "text-destructive" },
  OUTDATED: { label: "Desatualizado", color: "text-muted-foreground" },
  ERROR: { label: "Erro", color: "text-destructive" },
}

const ACCOUNT_TYPE_LABEL: Record<BankAccountType, string> = {
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  CREDIT: "Cartão de crédito",
}

export function BankConnectionCard({ connection }: BankConnectionCardProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const status = STATUS_LABEL[connection.status] ?? {
    label: connection.status,
    color: "text-muted-foreground",
  }

  function handleSync() {
    setError(null)
    startTransition(async () => {
      const result = await triggerBankSync(connection.id)
      if ("error" in result) setError(result.error)
    })
  }

  function handleRemove() {
    setError(null)
    startTransition(async () => {
      const result = await removeBankConnection(connection.id)
      if ("error" in result) setError(result.error)
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {connection.bankImageUrl ? (
            <img
              src={connection.bankImageUrl}
              alt={connection.bankName}
              className="h-10 w-10 rounded-md object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-sm font-bold">
              {connection.bankName.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-semibold text-foreground">{connection.bankName}</div>
            <div className={`text-xs ${status.color}`}>{status.label}</div>
            {connection.lastSyncAt && (
              <div className="text-xs text-muted-foreground">
                Última sync: {new Date(connection.lastSyncAt).toLocaleString("pt-BR")}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSync}
            disabled={isPending}
            aria-label="Atualizar"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmRemove(true)}
            disabled={isPending}
            aria-label="Remover"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {connection.accounts.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {connection.accounts.map((acc) => (
            <li
              key={acc.id}
              className="flex items-center justify-between text-sm"
            >
              <div>
                <div className="font-medium">{acc.name}</div>
                <div className="text-xs text-muted-foreground">
                  {ACCOUNT_TYPE_LABEL[acc.type]}
                  {acc.number ? ` · ${acc.number}` : ""}
                </div>
              </div>
              <div className="font-semibold tabular-nums">
                {formatCurrency(acc.balance)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirmRemove && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm">
            Remover esta conexão? As transações importadas serão apagadas.
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remover"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmRemove(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}
