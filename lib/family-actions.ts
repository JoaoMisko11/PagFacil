"use server"

import crypto from "crypto"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { ActionState } from "@/lib/actions"

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autenticado")
  return session.user.id
}

export async function createFamilyInvite(): Promise<{ token: string } | { error: string }> {
  const userId = await getUserId()

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { familyId: true },
  })

  // Se não tem família, cria uma
  let familyId = user?.familyId
  if (!familyId) {
    familyId = crypto.randomUUID()
    await db.user.update({
      where: { id: userId },
      data: { familyId },
    })
    revalidatePath("/family")
  }

  // Cria convite (expira em 7 dias) com token criptograficamente seguro
  const secureToken = crypto.randomBytes(32).toString("hex")
  const invite = await db.familyInvite.create({
    data: {
      token: secureToken,
      familyId,
      invitedBy: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  return { token: invite.token }
}

export async function acceptFamilyInvite(token: string): Promise<ActionState> {
  const userId = await getUserId()

  const invite = await db.familyInvite.findUnique({
    where: { token },
  })

  if (!invite) {
    return { message: "Convite não encontrado." }
  }

  if (invite.acceptedAt) {
    return { message: "Este convite já foi aceito." }
  }

  if (invite.expiresAt < new Date()) {
    return { message: "Este convite expirou." }
  }

  // Verifica se o usuário já está nesta família
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { familyId: true },
  })

  if (user?.familyId === invite.familyId) {
    return { message: "Você já faz parte desta família." }
  }

  // Atualiza o usuário com o familyId e marca convite como aceito
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { familyId: invite.familyId },
    }),
    db.familyInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ])

  revalidatePath("/")
  revalidatePath("/bills")
  revalidatePath("/pagamentos")
  revalidatePath("/family")

  return { message: "Convite aceito! Agora você compartilha contas com sua família." }
}

export async function leaveFamily(): Promise<ActionState> {
  const userId = await getUserId()

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { familyId: true },
  })

  if (!user?.familyId) {
    return { message: "Você não faz parte de uma família." }
  }

  await db.user.update({
    where: { id: userId },
    data: { familyId: null },
  })

  revalidatePath("/")
  revalidatePath("/bills")
  revalidatePath("/pagamentos")
  revalidatePath("/family")

  return { message: "Você saiu da família. Agora só verá suas próprias contas." }
}
