/**
 * Sync de contas e transações do Pluggy → banco PagaFácil.
 * Não tem "use server" — é importado por server actions, webhook handler e cron.
 */

import { db } from "@/lib/db"
import {
  getItem,
  listAccounts,
  listAllTransactions,
} from "@/lib/pluggy"
import {
  dateNDaysAgo,
  mapPluggySubtype,
  maskAccountNumber,
  pluggyAmountToCents,
} from "@/lib/pluggy-utils"
import {
  decideFromScore,
  findBestMatch,
  type MatchableBill,
} from "@/lib/transaction-match"
import { generateFutureDates } from "@/lib/bill-utils"
import { getFamilyUserIds } from "@/lib/family"

interface SyncOptions {
  /** Quantos dias para trás buscar transações (default 30). */
  initialDays?: number
}

interface SyncResult {
  accountsSynced: number
  transactionsCreated: number
  transactionsSkipped: number
  autoMatched: number
  suggested: number
}

/**
 * Sincroniza uma BankConnection: atualiza status do item, contas e transações.
 * Idempotente — chama upsert por pluggyTransactionId/pluggyAccountId.
 */
export async function syncBankConnection(
  connectionId: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const initialDays = options.initialDays ?? 30
  const connection = await db.bankConnection.findUnique({
    where: { id: connectionId },
    include: { accounts: true },
  })
  if (!connection) throw new Error(`Connection ${connectionId} não encontrada`)

  // 1. Atualiza status do item
  const item = await getItem(connection.pluggyItemId)
  await db.bankConnection.update({
    where: { id: connectionId },
    data: {
      status: item.status,
      statusDetail: item.statusDetail ?? null,
      bankName: item.connector.name,
      bankImageUrl: item.connector.imageUrl ?? null,
      lastSyncAt: new Date(),
    },
  })

  // 2. Atualiza contas
  const pluggyAccounts = await listAccounts(connection.pluggyItemId)
  let accountsSynced = 0
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
        subtype: acc.subtype,
      },
    })
    accountsSynced += 1
  }

  // 3. Para cada conta persistida, busca transações
  const accounts = await db.bankAccount.findMany({
    where: { connectionId: connection.id },
  })

  const from = dateNDaysAgo(initialDays)
  let transactionsCreated = 0
  let transactionsSkipped = 0

  for (const account of accounts) {
    const txs = await listAllTransactions({
      accountId: account.pluggyAccountId,
      from,
    })

    for (const tx of txs) {
      const existing = await db.bankTransaction.findUnique({
        where: { pluggyTransactionId: tx.id },
      })
      if (existing) {
        transactionsSkipped += 1
        continue
      }
      await db.bankTransaction.create({
        data: {
          pluggyTransactionId: tx.id,
          accountId: account.id,
          amount: pluggyAmountToCents(tx.amount),
          date: new Date(tx.date),
          description: tx.description,
          pluggyCategory: tx.category ?? null,
          type: tx.type,
        },
      })
      transactionsCreated += 1
    }
  }

  // 4. Roda matching para transações UNMATCHED do usuário desta conexão
  const matchResult = await matchTransactionsForUser(connection.userId)

  return {
    accountsSynced,
    transactionsCreated,
    transactionsSkipped,
    autoMatched: matchResult.autoMatched,
    suggested: matchResult.suggested,
  }
}

/**
 * Roda matching para todas as transações UNMATCHED do usuário (e família).
 * Apenas DEBIT são consideradas. Bills PENDING que ainda não têm transação associada.
 */
export async function matchTransactionsForUser(
  userId: string
): Promise<{ autoMatched: number; suggested: number }> {
  const userIds = await getFamilyUserIds(userId)

  // Transações UNMATCHED de débito do usuário (via accounts → connection → user)
  const unmatchedTxs = await db.bankTransaction.findMany({
    where: {
      matchStatus: "UNMATCHED",
      type: "DEBIT",
      account: {
        connection: { userId: { in: userIds } },
      },
    },
    orderBy: { date: "asc" },
  })

  if (unmatchedTxs.length === 0) {
    return { autoMatched: 0, suggested: 0 }
  }

  // Bills candidatas: PENDING, sem transação já vinculada, do usuário/família
  const candidateBills = await db.bill.findMany({
    where: {
      userId: { in: userIds },
      status: "PENDING",
      deletedAt: null,
      bankTransaction: null,
    },
    select: { id: true, supplier: true, amount: true, dueDate: true, isRecurring: true, recurrenceFrequency: true, recurrenceEndDate: true, category: true, notes: true, userId: true },
  })

  if (candidateBills.length === 0) {
    return { autoMatched: 0, suggested: 0 }
  }

  let autoMatched = 0
  let suggested = 0
  const matchedBillIds = new Set<string>()

  for (const tx of unmatchedTxs) {
    // Filtra bills ainda disponíveis nesta rodada
    const remaining: MatchableBill[] = candidateBills
      .filter((b) => !matchedBillIds.has(b.id))
      .map((b) => ({
        id: b.id,
        supplier: b.supplier,
        amount: b.amount,
        dueDate: b.dueDate,
      }))

    const best = findBestMatch(
      { amount: tx.amount, date: tx.date, description: tx.description },
      remaining
    )
    if (!best) continue

    const decision = decideFromScore(best.score)
    const bill = candidateBills.find((b) => b.id === best.billId)
    if (!bill) continue

    if (decision === "AUTO_MATCHED") {
      // Marca bill como paga + cria parcelas recorrentes (mesma lógica de markBillAsPaid)
      const ops = [
        db.bill.update({
          where: { id: bill.id },
          data: { status: "PAID", paidAt: tx.date },
        }),
        db.bankTransaction.update({
          where: { id: tx.id },
          data: {
            matchStatus: "AUTO_MATCHED",
            matchScore: best.score,
            matchedBillId: bill.id,
          },
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
      matchedBillIds.add(bill.id)
      autoMatched += 1
    } else if (decision === "SUGGESTED") {
      await db.bankTransaction.update({
        where: { id: tx.id },
        data: {
          matchStatus: "SUGGESTED",
          matchScore: best.score,
          matchedBillId: bill.id,
        },
      })
      // Não marca a bill como "tomada" — ela continua candidata para outra tx ou o usuário pode rejeitar
      suggested += 1
    }
  }

  return { autoMatched, suggested }
}
