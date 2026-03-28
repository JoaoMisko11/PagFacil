import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verifique seu email</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>
            Enviamos um link de acesso para o seu email.
          </p>
          <p className="mt-2">
            Clique no link para entrar no PagaFácil.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
