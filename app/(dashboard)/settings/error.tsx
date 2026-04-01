"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function SettingsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-3xl">!</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Erro ao carregar configuracoes
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nao conseguimos carregar suas configuracoes. Pode ser uma instabilidade
            temporaria — tente novamente.
          </p>
          <Button onClick={reset} className="mt-6 h-11 w-full">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
