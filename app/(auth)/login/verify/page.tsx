import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl">&#9993;&#65039;</span>
          </div>
          <CardTitle className="text-xl">Verifique seu email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
          <p>
            Enviamos um link de acesso para o seu email.
            Clique no link para entrar no PagaFácil.
          </p>

          <div className="rounded-lg bg-muted/50 p-3 text-xs">
            <p className="font-medium text-foreground">Nao encontrou?</p>
            <p className="mt-1">
              Verifique sua pasta de spam ou lixo eletronico. O email pode levar ate 2 minutos para chegar.
            </p>
          </div>

          <Link href="/login" className="block">
            <Button variant="outline" className="h-11 w-full">
              Voltar e tentar novamente
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
