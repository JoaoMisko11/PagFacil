"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { acceptFamilyInvite } from "@/lib/family-actions"
import { toast } from "sonner"

interface AcceptInviteCardProps {
  token: string
  inviterName: string
}

export function AcceptInviteCard({ token, inviterName }: AcceptInviteCardProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptFamilyInvite(token)
      if (result.message?.includes("aceito") || result.message?.includes("Convite aceito")) {
        toast.success(result.message)
        router.push("/family")
      } else {
        toast.error(result.message ?? "Erro ao aceitar convite.")
      }
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Convite de família</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          <strong>{inviterName}</strong> convidou você para compartilhar contas no PagaFácil.
        </p>
        <p className="text-sm text-muted-foreground">
          Ao aceitar, vocês verão e poderão gerenciar as mesmas contas.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            disabled={isPending}
          >
            Recusar
          </Button>
          <Button onClick={handleAccept} disabled={isPending}>
            {isPending ? "Aceitando..." : "Aceitar convite"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
