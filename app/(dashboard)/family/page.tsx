import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { FamilySettings } from "@/components/family-settings"

export default async function FamilyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { familyId: true, name: true },
  })

  let members: { id: string; name: string | null; email: string }[] = []

  if (user?.familyId) {
    members = await db.user.findMany({
      where: { familyId: user.familyId },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    })
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Família</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Compartilhe suas contas com outra pessoa. Ambos verão e poderão gerenciar as mesmas contas.
      </p>
      <FamilySettings
        currentUserId={session.user.id}
        familyId={user?.familyId ?? null}
        members={members}
      />
    </div>
  )
}
