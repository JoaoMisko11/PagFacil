import { LoginForm } from "@/components/login-form"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()
  if (session) redirect("/dashboard")

  const params = await searchParams
  const authError = params.error

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
              Suas contas a pagar organizadas com insights.<br />Sem planilha. Sem complicação. Grátis.
            </p>
          </div>

          {/* Erro de auth (ex: OAuthAccountNotLinked) */}
          {authError === "OAuthAccountNotLinked" && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              <p className="font-medium">Essa conta ja existe com outro metodo de login.</p>
              <p className="mt-1 text-xs">
                Entre primeiro com o metodo original (email ou Telegram) e depois vincule sua conta Google nas configuracoes.
              </p>
            </div>
          )}

          {/* Login */}
          <LoginForm />

          {/* Trust + Social proof */}
          <div className="space-y-2 text-center text-xs text-muted-foreground">
            <p className="flex items-center justify-center gap-1.5">
              <span>&#128274;</span>
              Seus dados protegidos. Nao compartilhamos com terceiros.
            </p>
            <p>
              Feito para MEIs e pessoas fisicas que querem sair da planilha.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        PagaFacil &mdash; 100% gratuito, sem cartao de credito.
      </footer>
    </div>
  )
}
