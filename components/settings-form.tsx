"use client"

import { useActionState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateNotificationPreferences, sendMyRemindersNow } from "@/lib/actions"
import type { ActionState } from "@/lib/actions"
import { PushToggle } from "@/components/push-toggle"
import { toast } from "sonner"

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
  const [sending, startSending] = useTransition()

  const channels = notifyVia.split(",")

  return (
    <div className="space-y-4">
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
            <p className="text-xs text-muted-foreground">Você pode marcar mais de um canal.</p>
            {state.errors?.notifyVia && (
              <p className="text-xs text-destructive">
                {state.errors.notifyVia[0]}
              </p>
            )}
            <div className="space-y-2">
              {!isTelegramOnlyUser && (
                <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="checkbox"
                    name="notifyVia"
                    value="email"
                    defaultChecked={channels.includes("email")}
                    className="h-4 w-4 text-primary rounded"
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
                  type="checkbox"
                  name="notifyVia"
                  value="telegram"
                  defaultChecked={channels.includes("telegram")}
                  className="h-4 w-4 text-primary rounded"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Telegram</p>
                  <p className="text-xs text-muted-foreground">
                    Receba lembretes via @pagafacil_bot
                  </p>
                </div>
              </label>
            </div>

            {/* Push Notifications */}
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Push no navegador</p>
                  <p className="text-xs text-muted-foreground">
                    Receba notificações diretamente no celular/desktop
                  </p>
                </div>
                <PushToggle />
              </div>
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

    {/* Enviar lembrete agora */}
    <Card>
      <CardHeader>
        <CardTitle>Enviar lembrete agora</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Dispare um resumo das suas contas pendentes (vencidas + próximos 7 dias) pelos canais configurados acima.
        </p>
        <p className="text-xs text-muted-foreground">
          Lembrete automático: todo dia às 8h (horário de Brasília) para contas que vencem no dia seguinte.
        </p>
        <Button
          variant="outline"
          className="w-full"
          disabled={sending}
          onClick={() => {
            startSending(async () => {
              const result = await sendMyRemindersNow()
              if (result.message) toast.success(result.message)
              if (result.errors) toast.error(result.errors._form?.[0] ?? "Erro ao enviar")
            })
          }}
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Enviando...
            </span>
          ) : (
            "Enviar lembrete agora"
          )}
        </Button>
      </CardContent>
    </Card>
    </div>
  )
}
