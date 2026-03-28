import { LoginForm } from "@/components/login-form"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/")

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <span className="text-2xl font-bold text-white">P</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">PagaFácil</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerencie suas contas a pagar sem planilha
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
