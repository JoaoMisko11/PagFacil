"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUserName, createBillOnboarding, type ActionState } from "@/lib/actions"
import { CATEGORIES } from "@/lib/constants"

interface OnboardingStepsProps {
  step: "name" | "bill"
}

export function OnboardingSteps({ step }: OnboardingStepsProps) {
  if (step === "name") return <NameStep />
  return <BillStep />
}

function NameStep() {
  const [state, formAction, pending] = useActionState(updateUserName, {})

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Bem-vindo ao PagaFácil!</CardTitle>
        <p className="text-sm text-muted-foreground">
          Como podemos te chamar?
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Seu nome</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: Ana Silva"
              autoFocus
              required
              className="h-12 text-base"
            />
            {state.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

          {state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
            {pending ? "Salvando..." : "Continuar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function BillStep() {
  const [state, formAction, pending] = useActionState(createBillOnboarding, {})

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Cadastre sua primeira conta</CardTitle>
        <p className="text-sm text-muted-foreground">
          Pode ser qualquer conta que vence em breve.
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier">Fornecedor *</Label>
            <Input
              id="supplier"
              name="supplier"
              placeholder="Ex: Conta de luz, Netflix"
              autoFocus
              required
              className="h-12 text-base"
            />
            {state.errors?.supplier && (
              <p className="text-sm text-destructive">{state.errors.supplier[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                required
                className="h-12 text-base"
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
                required
                className="h-12 text-base"
              />
              {state.errors?.dueDate && (
                <p className="text-sm text-destructive">{state.errors.dueDate[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select name="category" defaultValue="OUTRO">
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Opcional..."
              rows={2}
            />
          </div>

          <input type="hidden" name="isRecurring" value="off" />

          {state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
            {pending ? "Salvando..." : "Cadastrar e começar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
