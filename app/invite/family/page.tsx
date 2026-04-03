import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AcceptInviteCard } from "@/components/accept-invite-card"

interface InvitePageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function AcceptFamilyInvitePage({ searchParams }: InvitePageProps) {
  const params = await searchParams
  const token = params.token

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold">Link inválido</p>
          <p className="mt-1 text-sm text-muted-foreground">Este link de convite não é válido.</p>
        </div>
      </div>
    )
  }

  const session = await auth()

  // Se não está logado, redireciona para login com callback
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/invite/family?token=${token}`)
  }

  // Busca o convite
  const invite = await db.familyInvite.findUnique({
    where: { token },
    include: {
      inviter: { select: { name: true, email: true } },
    },
  })

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold">Convite não encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">Este convite pode ter sido removido.</p>
        </div>
      </div>
    )
  }

  if (invite.acceptedAt) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold">Convite já aceito</p>
          <p className="mt-1 text-sm text-muted-foreground">Este convite já foi utilizado.</p>
        </div>
      </div>
    )
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold">Convite expirado</p>
          <p className="mt-1 text-sm text-muted-foreground">Peça um novo convite.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <AcceptInviteCard
        token={token}
        inviterName={invite.inviter.name ?? invite.inviter.email}
      />
    </div>
  )
}
