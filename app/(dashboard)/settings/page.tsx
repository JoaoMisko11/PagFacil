import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings-form"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      telegramChatId: true,
      notifyVia: true,
      email: true,
    },
  })

  if (!user) redirect("/login")

  const isTelegramOnlyUser = user.email.endsWith("@pagafacil.local")

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Configurações</h1>
      <SettingsForm
        telegramChatId={user.telegramChatId ?? ""}
        notifyVia={user.notifyVia}
        isTelegramOnlyUser={isTelegramOnlyUser}
      />
    </div>
  )
}
