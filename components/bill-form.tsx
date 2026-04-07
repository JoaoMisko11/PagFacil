"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import type { ActionState } from "@/lib/action-types"
import { CATEGORIES, RECURRENCE_FREQUENCIES } from "@/lib/constants"

interface BillFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: {
    supplier?: string
    amount?: string
    dueDate?: string
    category?: string
    notes?: string
    isRecurring?: boolean
    recurrenceFrequency?: string
    recurrenceEndDate?: string
  }
  submitLabel?: string
}

export function BillForm({
  action,
  defaultValues,
  submitLabel = "Salvar conta",
}: BillFormProps) {
  const [state, formAction, pending] = useActionState(action, {})
  const [isRecurring, setIsRecurring] = useState(defaultValues?.isRecurring ?? false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{defaultValues ? "Editar Conta" : "Nova Conta"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier">Fornecedor *</Label>
            <Input
              id="supplier"
              name="supplier"
              placeholder="Ex: Conta de luz, Netflix, Fornecedor X"
              defaultValue={defaultValues?.supplier}
              required
              className="h-11"
            />
            {state.errors?.supplier && (
              <p className="text-sm text-destructive">{state.errors.supplier[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                defaultValue={defaultValues?.amount}
                required
                className="h-11"
              />
              {state.errors?.amount && (
                <p className="text-sm text-destructive">{state.errors.amount[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Vencimento *</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={defaultValues?.dueDate}
                required
                className="h-11"
              />
              {state.errors?.dueDate && (
                <p className="text-sm text-destructive">{state.errors.dueDate[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select name="category" defaultValue={defaultValues?.category ?? "OUTRO"}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.errors?.category && (
              <p className="text-sm text-destructive">{state.errors.category[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Anotações opcionais..."
              defaultValue={defaultValues?.notes}
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="isRecurring"
                name="isRecurring"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Label htmlFor="isRecurring" className="font-normal">
                Essa conta é recorrente
              </Label>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="recurrenceFrequency">Frequência</Label>
                  <Select
                    name="recurrenceFrequency"
                    defaultValue={defaultValues?.recurrenceFrequency ?? "MONTHLY"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceEndDate">Data de fim</Label>
                  <Input
                    id="recurrenceEndDate"
                    name="recurrenceEndDate"
                    type="date"
                    defaultValue={defaultValues?.recurrenceEndDate}
                    placeholder="Opcional"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">Opcional</p>
                </div>
              </div>
            )}
          </div>

          {state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <div className="flex gap-3">
            <Link href="/bills">
              <Button type="button" variant="outline" className="h-11">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={pending} className="h-11 flex-1">
              {pending ? "Salvando..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
