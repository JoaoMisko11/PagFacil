"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateNotificationPreferences } from "@/lib/actions"
import type { ActionState } from "@/lib/actions"

interface SettingsFormProps {
  telegramChatId: string
  notifyVia: string
  isTelegramOnlyUser: boolean
}

export function SettingsForm({
  telegramChatId,
  notifyVia,
  isTelegramOnlyUser,
}: SettingsFormProps) {
  const [state, action, pending] = useActionState(
    updateNotificationPreferences,
    {} as ActionState
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          {/* Telegram Chat ID */}
          <div className="space-y-2">
            <Label htmlFor="telegramChatId">Chat ID do Telegram</Label>
            <Input
              id="telegramChatId"
              name="telegramChatId"
              type="text"
              inputMode="numeric"
              placeholder="Ex: 123456789"
              defaultValue={telegramChatId}
            />
            {state.errors?.telegramChatId && (
              <p className="text-xs text-destructive">
                {state.errors.telegramChatId[0]}
              </p>
            )}
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <p>
                Abra <span className="font-medium text-foreground">@pagafacil_bot</span> no
                Telegram e envie <span className="font-medium text-foreground">/start</span> para
                descobrir seu Chat ID.
              </p>
            </div>
          </div>

          {/* Canal de notificação */}
          <div className="space-y-3">
            <Label>Receber lembretes por</Label>
            <div className="space-y-2">
              {!isTelegramOnlyUser && (
                <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="radio"
                    name="notifyVia"
                    value="email"
                    defaultChecked={notifyVia === "email"}
                    className="h-4 w-4 text-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-xs text-muted-foreground">
                      Receba lembretes por email D-1
                    </p>
                  </div>
                </label>
              )}
              <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted transition-colors">
                <input
                  type="radio"
                  name="notifyVia"
                  value="telegram"
                  defaultChecked={notifyVia === "telegram"}
                  className="h-4 w-4 text-primary"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Telegram</p>
                  <p className="text-xs text-muted-foreground">
                    Receba lembretes via @pagafacil_bot
                  </p>
                </div>
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar preferências"}
          </Button>

          {state.message && !state.errors && (
            <p className="text-center text-sm text-green-600 dark:text-green-400">
              {state.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
