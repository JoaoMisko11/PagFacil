"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createFamilyInvite, leaveFamily } from "@/lib/family-actions"
import { toast } from "sonner"

interface FamilySettingsProps {
  currentUserId: string
  familyId: string | null
  members: { id: string; name: string | null; email: string }[]
}

export function FamilySettings({ currentUserId, familyId, members }: FamilySettingsProps) {
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreateInvite() {
    startTransition(async () => {
      const result = await createFamilyInvite()
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      const link = `${window.location.origin}/invite/family?token=${result.token}`
      setInviteLink(link)
    })
  }

  function handleCopyLink() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    toast.success("Link copiado!")
  }

  function handleLeave() {
    if (!confirm("Tem certeza? Você deixará de ver as contas compartilhadas.")) return
    startTransition(async () => {
      const result = await leaveFamily()
      if (result.message) toast.info(result.message)
    })
  }

  // Sem família ainda
  if (!familyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convidar alguém</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Gere um link de convite e envie para a pessoa com quem deseja compartilhar suas contas.
          </p>

          {inviteLink ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm"
                />
                <Button size="sm" onClick={handleCopyLink}>
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Válido por 7 dias. A pessoa precisa ter ou criar uma conta no PagaFácil.
              </p>
            </div>
          ) : (
            <Button onClick={handleCreateInvite} disabled={isPending}>
              {isPending ? "Gerando..." : "Gerar link de convite"}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Com família
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membros da família</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {member.name ?? "Sem nome"}
                    {member.id === currentUserId && (
                      <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convidar mais alguém</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {inviteLink ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm"
                />
                <Button size="sm" onClick={handleCopyLink}>
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Válido por 7 dias.
              </p>
            </div>
          ) : (
            <Button variant="outline" onClick={handleCreateInvite} disabled={isPending}>
              {isPending ? "Gerando..." : "Gerar link de convite"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sair da família</p>
              <p className="text-xs text-muted-foreground">
                Você deixará de ver as contas compartilhadas.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeave}
              disabled={isPending}
            >
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
