import { LoginForm } from "@/components/login-form"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo + headline */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
              <span className="text-2xl font-bold text-primary-foreground">P</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">PagaFácil</h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Suas contas a pagar organizadas.<br />Sem planilha. Sem complicação. Grátis.
            </p>
          </div>

          {/* Benefícios */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="mb-1 text-2xl">&#128203;</div>
              <p className="text-sm font-medium text-foreground">Cadastre contas</p>
              <p className="text-xs text-muted-foreground">Valor, vencimento, fornecedor</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="mb-1 text-2xl">&#128276;</div>
              <p className="text-sm font-medium text-foreground">Receba lembretes</p>
              <p className="text-xs text-muted-foreground">Email ou Telegram D-1</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="mb-1 text-2xl">&#9989;</div>
              <p className="text-sm font-medium text-foreground">Marque como paga</p>
              <p className="text-xs text-muted-foreground">Controle total com 1 toque</p>
            </div>
          </div>

          {/* Login */}
          <LoginForm />

          {/* Social proof */}
          <p className="text-center text-xs text-muted-foreground">
            Feito para MEIs e pessoas fisicas que querem sair da planilha.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        PagaFacil &mdash; 100% gratuito, sem cartao de credito.
      </footer>
    </div>
  )
}
