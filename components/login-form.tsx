"use client"

import { signIn } from "next-auth/react"
import { useState, useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sendTelegramOtp } from "@/lib/actions"
import type { ActionState } from "@/lib/actions"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)

  const [chatId, setChatId] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [telegramLoading, setTelegramLoading] = useState(false)

  const [otpState, otpAction] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await sendTelegramOtp(prevState, formData)
      if (result.message) {
        setOtpSent(true)
      }
      return result
    },
    {} as ActionState
  )

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailLoading(true)
    await signIn("resend", { email, callbackUrl: "/" })
  }

  async function handleTelegramLogin(e: React.FormEvent) {
    e.preventDefault()
    setTelegramLoading(true)
    const result = await signIn("telegram-otp", {
      chatId,
      code: otpCode,
      callbackUrl: "/",
      redirect: false,
    })
    if (result?.error) {
      setTelegramLoading(false)
      alert("Código inválido ou expirado. Tente novamente.")
    } else {
      window.location.href = "/"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-lg">Entrar no PagaFácil</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
          </TabsList>

          {/* Tab Email */}
          <TabsContent value="email">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={emailLoading}>
                {emailLoading ? "Enviando..." : "Enviar link de acesso"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Sem senha. Enviamos um link mágico pro seu email.
              </p>
            </form>
          </TabsContent>

          {/* Tab Telegram */}
          <TabsContent value="telegram">
            {!otpSent ? (
              <form action={otpAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chatId">Chat ID do Telegram</Label>
                  <Input
                    id="chatId"
                    name="chatId"
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 123456789"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    required
                  />
                  {otpState.errors?.chatId && (
                    <p className="text-xs text-destructive">
                      {otpState.errors.chatId[0]}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  Enviar código
                </Button>
                <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Como descobrir seu Chat ID:</p>
                  <ol className="mt-1 list-inside list-decimal space-y-1">
                    <li>
                      Abra o Telegram e busque por{" "}
                      <span className="font-medium text-foreground">@pagafacil_bot</span>
                    </li>
                    <li>Envie <span className="font-medium text-foreground">/start</span></li>
                    <li>O bot vai responder com seu Chat ID</li>
                    <li>Copie e cole acima</li>
                  </ol>
                </div>
              </form>
            ) : (
              <form onSubmit={handleTelegramLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otpCode">Código de verificação</Label>
                  <Input
                    id="otpCode"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Enviamos um código de 6 dígitos para seu Telegram.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={telegramLoading || otpCode.length !== 6}
                >
                  {telegramLoading ? "Entrando..." : "Entrar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => {
                    setOtpSent(false)
                    setOtpCode("")
                  }}
                >
                  Reenviar código
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
