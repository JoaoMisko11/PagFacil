"use client"

import { useState, useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { submitFeedback } from "@/lib/actions"
import type { ActionState } from "@/lib/action-types"

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await submitFeedback(prev, formData)
      if (result.message === "Obrigado pelo feedback!") {
        setTimeout(() => setOpen(false), 1500)
      }
      return result
    },
    {}
  )

  const isSuccess = state.message === "Obrigado pelo feedback!"

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
        aria-label="Enviar feedback"
      >
        <span className="text-xl">?</span>
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-lg border bg-card p-4 shadow-xl sm:bottom-22 sm:right-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Sugerir feature</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              &#x2715;
            </button>
          </div>

          {isSuccess ? (
            <p className="py-4 text-center text-sm text-primary font-medium">
              {state.message}
            </p>
          ) : (
            <form action={formAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="feedback-type" className="text-sm">Tipo</Label>
                <Select name="type" defaultValue="feature">
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Sugestão de feature</SelectItem>
                    <SelectItem value="bug">Reportar problema</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="feedback-message" className="text-sm">Mensagem</Label>
                <Textarea
                  id="feedback-message"
                  name="message"
                  placeholder="O que você gostaria de ver no PagaFácil?"
                  rows={3}
                  required
                />
                {state.errors?.message && (
                  <p className="text-xs text-destructive">{state.errors.message[0]}</p>
                )}
              </div>

              {state.message && !isSuccess && (
                <p className="text-xs text-destructive">{state.message}</p>
              )}

              <Button type="submit" className="h-10 w-full" disabled={pending}>
                {pending ? "Enviando..." : "Enviar feedback"}
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
