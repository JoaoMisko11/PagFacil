"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import {
  createConnectToken,
  getItem,
  listAccounts,
  deleteItem,
} from "@/lib/pluggy"
import { mapPluggySubtype, pluggyAmountToCents, maskAccountNumber } from "@/lib/pluggy-utils"
import { syncBankConnection } from "@/lib/bank-sync"
import { generateFutureDates } from "@/lib/bill-utils"
import { getFamilyUserIds } from "@/lib/family"

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autenticado")
  return session.user.id
}

/** Gera um connect token para abrir o widget Pluggy Connect. */
export async function requestBankConnectToken(): Promise<
  { accessToken: string } | { error: string }
> {
  try {
    const userId = await getUserId()
    const result = await createConnectToken({ clientUserId: userId })
    return { accessToken: result.accessToken }
  } catch (e) {
    console.error("[bank-actions] requestBankConnectToken:", e)
    return { error: "Não foi possível iniciar a conexão com o banco." }
  }
}

/** Confirma a conexão após o widget retornar com sucesso. Persiste item, contas e roda sync inicial. */
export async function confirmBankConnection(
  pluggyItemId: string
): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await getUserId()

    // Busca o item da Pluggy
    const item = await getItem(pluggyItemId)

    // Cria/atualiza BankConnection
    const connection = await db.bankConnection.upsert({
      where: { pluggyItemId },
      create: {
        pluggyItemId,
        userId,
        bankName: item.connector.name,
        bankImageUrl: item.connector.imageUrl ?? null,
        status: item.status,
        statusDetail: item.statusDetail ?? null,
        lastSyncAt: item.lastUpdatedAt ? new Date(item.lastUpdatedAt) : null,
      },
      update: {
        status: item.status,
        statusDetail: item.statusDetail ?? null,
        lastSyncAt: item.lastUpdatedAt ? new Date(item.lastUpdatedAt) : null,
      },
    })

    // Busca contas e persiste apenas tipos suportados (CHECKING, SAVINGS, CREDIT)
    const pluggyAccounts = await listAccounts(pluggyItemId)
    for (const acc of pluggyAccounts) {
      const type = mapPluggySubtype(acc.subtype)
      if (!type) continue
      await db.bankAccount.upsert({
        where: { pluggyAccountId: acc.id },
        create: {
          pluggyAccountId: acc.id,
          connectionId: connection.id,
          type,
          subtype: acc.subtype,
          name: acc.name,
          number: maskAccountNumber(acc.number),
          balance: pluggyAmountToCents(acc.balance),
          currencyCode: acc.currencyCode,
        },
        update: {
          balance: pluggyAmountToCents(acc.balance),
          name: acc.name,
        },
      })
    }

    // Sync inicial em background (últimos 30 dias). Não bloqueia o retorno —
    // se falhar o usuário vê os dados quando o webhook ou cron rodar.
    syncBankConnection(connection.id, { initialDays: 30 }).catch((e) =>
      console.error("[bank-actions] sync inicial falhou:", e)
    )

    revalidatePath("/bancos")
    return { ok: true }
  } catch (e) {
    console.error("[bank-actions] confirmBankConnection:", e)
    return { error: "Não foi possível salvar a conexão." }
  }
}

/** Remove uma conexão (no Pluggy e no banco). */
export async function removeBankConnection(
  connectionId: string
): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await getUserId()
    const connection = await db.bankConnection.findUnique({
      where: { id: connectionId },
    })
    if (!connection || connection.userId !== userId) {
      return { error: "Conexão não encontrada." }
    }

    // Best-effort: tenta remover no Pluggy mas não bloqueia se falhar
    try {
      await deleteItem(connection.pluggyItemId)
    } catch (e) {
      console.error("[bank-actions] deleteItem (Pluggy) falhou:", e)
    }

    await db.bankConnection.delete({ where: { id: connectionId } })
    revalidatePath("/bancos")
    return { ok: true }
  } catch (e) {
    console.error("[bank-actions] removeBankConnection:", e)
    return { error: "Não foi possível remover a conexão." }
  }
}

/**
 * Confirma um match SUGGESTED: marca a bill como paga (com paidAt = data da transação)
 * e gera parcelas recorrentes se aplicável.
 */
export async function confirmTransactionMatch(
  transactionId: string
): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await getUserId()
    const userIds = await getFamilyUserIds(userId)

    const tx = await db.bankTransaction.findFirst({
      where: {
        id: transactionId,
        account: { connection: { userId: { in: userIds } } },
      },
    })
    if (!tx) return { error: "Transação não encontrada." }
    if (!tx.matchedBillId) return { error: "Sem conta vinculada para confirmar." }

    const bill = await db.bill.findFirst({
      where: { id: tx.matchedBillId, userId: { in: userIds } },
    })
    if (!bill) return { error: "Conta não encontrada." }

    const ops = [
      db.bill.update({
        where: { id: bill.id },
        data: { status: "PAID", paidAt: tx.date },
      }),
      db.bankTransaction.update({
        where: { id: tx.id },
        data: { matchStatus: "USER_CONFIRMED" },
      }),
    ]

    if (bill.isRecurring) {
      const freq = bill.recurrenceFrequency ?? "MONTHLY"
      const lastPending = await db.bill.findFirst({
        where: {
          userId: { in: userIds },
          supplier: bill.supplier,
          isRecurring: true,
          deletedAt: null,
          status: "PENDING",
          id: { not: bill.id },
        },
        orderBy: { dueDate: "desc" },
      })
      const lastDate = lastPending?.dueDate ?? bill.dueDate
      const futureDates = generateFutureDates(lastDate, freq, bill.recurrenceEndDate)
      for (const d of futureDates) {
        ops.push(
          db.bill.create({
            data: {
              supplier: bill.supplier,
              amount: bill.amount,
              dueDate: d,
              category: bill.category,
              notes: bill.notes,
              isRecurring: true,
              recurrenceFrequency: bill.recurrenceFrequency,
              recurrenceEndDate: bill.recurrenceEndDate,
              userId: bill.userId,
            },
          })
        )
      }
    }

    await db.$transaction(ops)
    revalidatePath("/bancos")
    revalidatePath("/pagamentos")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (e) {
    console.error("[bank-actions] confirmTransactionMatch:", e)
    return { error: "Não foi possível confirmar o match." }
  }
}

/** Rejeita uma sugestão de match: transação fica IGNORED, bill volta a ficar disponível. */
export async function ignoreTransactionMatch(
  transactionId: string
): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await getUserId()
    const userIds = await getFamilyUserIds(userId)

    const tx = await db.bankTransaction.findFirst({
      where: {
        id: transactionId,
        account: { connection: { userId: { in: userIds } } },
      },
    })
    if (!tx) return { error: "Transação não encontrada." }

    await db.bankTransaction.update({
      where: { id: tx.id },
      data: { matchStatus: "IGNORED", matchedBillId: null, matchScore: null },
    })
    revalidatePath("/bancos")
    return { ok: true }
  } catch (e) {
    console.error("[bank-actions] ignoreTransactionMatch:", e)
    return { error: "Não foi possível ignorar o match." }
  }
}

/** Dispara um sync manual de uma conexão. */
export async function triggerBankSync(
  connectionId: string
): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await getUserId()
    const connection = await db.bankConnection.findUnique({
      where: { id: connectionId },
    })
    if (!connection || connection.userId !== userId) {
      return { error: "Conexão não encontrada." }
    }

    await syncBankConnection(connectionId, { initialDays: 30 })
    revalidatePath("/bancos")
    return { ok: true }
  } catch (e) {
    console.error("[bank-actions] triggerBankSync:", e)
    return { error: "Sync falhou." }
  }
}
