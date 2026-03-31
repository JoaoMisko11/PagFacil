import { NextResponse } from "next/server"
import { sendTelegramMessage } from "@/lib/telegram"
import { db } from "@/lib/db"
import type { Category } from "@prisma/client"

// Estado temporário para fluxo /pagar (chatId → lista de bills)
const paySessionMap = new Map<string, { billIds: string[]; expires: number }>()

const CATEGORIES: Category[] = [
  "FIXO",
  "VARIAVEL",
  "IMPOSTO",
  "FORNECEDOR",
  "ASSINATURA",
  "OUTRO",
]

function formatCurrency(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
}

async function findUserByChatId(chatId: string) {
  return db.user.findUnique({
    where: { telegramChatId: chatId },
    select: { id: true, name: true },
  })
}

// ─── /contas ───────────────────────────────────────────────
async function handleContas(chatId: string, userId: string) {
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const bills = await db.bill.findMany({
    where: {
      userId,
      deletedAt: null,
      status: { in: ["PENDING", "OVERDUE"] },
      dueDate: { lte: in30Days },
    },
    orderBy: { dueDate: "asc" },
    take: 20,
  })

  if (bills.length === 0) {
    await sendTelegramMessage(
      chatId,
      "🎉 Nenhuma conta pendente nos próximos 30 dias!"
    )
    return
  }

  const lines = bills.map((b, i) => {
    const emoji = b.status === "OVERDUE" ? "🔴" : "🟡"
    const dateStr = formatDate(b.dueDate)
    return `${emoji} <b>${i + 1}.</b> ${b.supplier} — ${formatCurrency(b.amount)} — ${dateStr}`
  })

  const overdue = bills.filter((b) => b.status === "OVERDUE").length
  const header = overdue > 0
    ? `📋 <b>${bills.length} contas</b> (${overdue} vencida${overdue > 1 ? "s" : ""}):\n`
    : `📋 <b>${bills.length} contas</b> pendentes:\n`

  await sendTelegramMessage(chatId, header + "\n" + lines.join("\n"))
}

// ─── /nova ─────────────────────────────────────────────────
async function handleNova(chatId: string, userId: string, args: string) {
  if (!args) {
    await sendTelegramMessage(
      chatId,
      "📝 <b>Como usar:</b>\n\n" +
        "<code>/nova Fornecedor 150,00 15/04/2026 FIXO</code>\n\n" +
        "<b>Categorias:</b> FIXO, VARIAVEL, IMPOSTO, FORNECEDOR, ASSINATURA, OUTRO\n\n" +
        "Obs: a categoria é opcional (padrão: OUTRO)"
    )
    return
  }

  // Parse: Fornecedor Valor DD/MM/AAAA [Categoria]
  // O fornecedor pode ter espaços, então pegamos valor e data de trás pra frente
  const parts = args.split(/\s+/)

  if (parts.length < 3) {
    await sendTelegramMessage(
      chatId,
      "❌ Formato inválido.\n\nUse: <code>/nova Fornecedor 150,00 15/04/2026 FIXO</code>"
    )
    return
  }

  // Tenta detectar categoria (último item, se for válida)
  let category: Category = "OUTRO"
  const lastUpper = parts[parts.length - 1].toUpperCase()
  if (CATEGORIES.includes(lastUpper as Category)) {
    category = lastUpper as Category
    parts.pop()
  }

  if (parts.length < 3) {
    await sendTelegramMessage(
      chatId,
      "❌ Formato inválido.\n\nUse: <code>/nova Fornecedor 150,00 15/04/2026</code>"
    )
    return
  }

  // Data é o último item agora
  const dateStr = parts.pop()!
  const dateMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!dateMatch) {
    await sendTelegramMessage(
      chatId,
      "❌ Data inválida. Use o formato <b>DD/MM/AAAA</b> (ex: 15/04/2026)"
    )
    return
  }
  const [, dd, mm, yyyy] = dateMatch
  const dueDate = new Date(`${yyyy}-${mm}-${dd}T12:00:00Z`)
  if (isNaN(dueDate.getTime())) {
    await sendTelegramMessage(chatId, "❌ Data inválida.")
    return
  }

  // Valor é o último item agora
  const valorStr = parts.pop()!
  const cleaned = valorStr.replace(/[^\d,\.]/g, "").replace(",", ".")
  const amount = Math.round(parseFloat(cleaned) * 100)
  if (isNaN(amount) || amount <= 0) {
    await sendTelegramMessage(
      chatId,
      "❌ Valor inválido. Use formato como <b>150,00</b> ou <b>1500</b>"
    )
    return
  }

  // O que sobrou é o nome do fornecedor
  const supplier = parts.join(" ").trim()
  if (!supplier) {
    await sendTelegramMessage(chatId, "❌ Nome do fornecedor é obrigatório.")
    return
  }

  try {
    await db.bill.create({
      data: {
        supplier,
        amount,
        dueDate,
        category,
        userId,
      },
    })

    await sendTelegramMessage(
      chatId,
      `✅ Conta criada!\n\n` +
        `<b>${supplier}</b>\n` +
        `Valor: ${formatCurrency(amount)}\n` +
        `Vencimento: ${formatDate(dueDate)}\n` +
        `Categoria: ${category}`
    )
  } catch (error) {
    console.error("Erro ao criar conta via Telegram:", error)
    await sendTelegramMessage(chatId, "❌ Erro ao criar conta. Tente novamente.")
  }
}

// ─── /pagar ────────────────────────────────────────────────
async function handlePagar(chatId: string, userId: string) {
  const bills = await db.bill.findMany({
    where: {
      userId,
      deletedAt: null,
      status: { in: ["PENDING", "OVERDUE"] },
    },
    orderBy: { dueDate: "asc" },
    take: 15,
  })

  if (bills.length === 0) {
    await sendTelegramMessage(chatId, "🎉 Nenhuma conta pendente para pagar!")
    return
  }

  const lines = bills.map((b, i) => {
    const emoji = b.status === "OVERDUE" ? "🔴" : "🟡"
    return `${emoji} <b>${i + 1}.</b> ${b.supplier} — ${formatCurrency(b.amount)} — ${formatDate(b.dueDate)}`
  })

  // Salva sessão (expira em 5 min)
  paySessionMap.set(chatId, {
    billIds: bills.map((b) => b.id),
    expires: Date.now() + 5 * 60 * 1000,
  })

  await sendTelegramMessage(
    chatId,
    `💰 Qual conta você pagou? Responda com o <b>número</b>:\n\n` +
      lines.join("\n") +
      `\n\n<i>Responda com o número (ex: 1) nos próximos 5 min.</i>`
  )
}

async function handlePaySelection(chatId: string, userId: string, num: number) {
  const session = paySessionMap.get(chatId)
  if (!session || Date.now() > session.expires) {
    paySessionMap.delete(chatId)
    return false // não tem sessão ativa
  }

  if (num < 1 || num > session.billIds.length) {
    await sendTelegramMessage(
      chatId,
      `❌ Número inválido. Escolha entre 1 e ${session.billIds.length}.`
    )
    return true
  }

  const billId = session.billIds[num - 1]
  paySessionMap.delete(chatId)

  try {
    const bill = await db.bill.findUnique({
      where: { id: billId, userId },
    })

    if (!bill || bill.status === "PAID") {
      await sendTelegramMessage(chatId, "❌ Conta não encontrada ou já paga.")
      return true
    }

    // Marca como paga (lógica simplificada — sem recorrência aqui para manter simples)
    await db.bill.update({
      where: { id: billId, userId },
      data: { status: "PAID", paidAt: new Date() },
    })

    // Se for recorrente, cria próxima parcela
    if (bill.isRecurring) {
      const d = new Date(bill.dueDate)
      const freq = bill.recurrenceFrequency ?? "MONTHLY"
      let nextDueDate: Date

      switch (freq) {
        case "WEEKLY":
          nextDueDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7, 12)
          break
        case "BIWEEKLY":
          nextDueDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 14, 12)
          break
        case "YEARLY":
          nextDueDate = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate(), 12)
          if (nextDueDate.getMonth() !== d.getMonth()) {
            nextDueDate.setDate(0)
            nextDueDate.setHours(12, 0, 0, 0)
          }
          break
        case "MONTHLY":
        default: {
          const nextMonth = d.getMonth() + 1
          nextDueDate = new Date(d.getFullYear(), nextMonth, d.getDate(), 12)
          if (nextDueDate.getMonth() !== nextMonth % 12) {
            nextDueDate.setDate(0)
            nextDueDate.setHours(12, 0, 0, 0)
          }
          break
        }
      }

      const shouldCreateNext =
        !bill.recurrenceEndDate || nextDueDate <= bill.recurrenceEndDate

      if (shouldCreateNext) {
        await db.bill.create({
          data: {
            supplier: bill.supplier,
            amount: bill.amount,
            dueDate: nextDueDate,
            category: bill.category,
            notes: bill.notes,
            isRecurring: true,
            recurrenceFrequency: bill.recurrenceFrequency,
            recurrenceEndDate: bill.recurrenceEndDate,
            userId,
          },
        })
      }
    }

    await sendTelegramMessage(
      chatId,
      `✅ <b>${bill.supplier}</b> — ${formatCurrency(bill.amount)} marcada como paga!`
    )
  } catch (error) {
    console.error("Erro ao marcar como paga via Telegram:", error)
    await sendTelegramMessage(chatId, "❌ Erro ao marcar como paga. Tente novamente.")
  }

  return true
}

// ─── /ajuda ────────────────────────────────────────────────
async function handleAjuda(chatId: string) {
  await sendTelegramMessage(
    chatId,
    `🤖 <b>Comandos do PagaFácil Bot:</b>\n\n` +
      `/contas — Ver contas pendentes\n` +
      `/nova — Criar nova conta\n` +
      `/pagar — Marcar conta como paga\n` +
      `/meuid — Ver seu Chat ID\n` +
      `/ajuda — Ver esta mensagem`
  )
}

// ─── Webhook Handler ───────────────────────────────────────
export async function POST(request: Request) {
  const body = await request.json()
  const message = body?.message

  if (!message?.chat?.id) {
    return NextResponse.json({ ok: true })
  }

  const chatId = String(message.chat.id)
  const text = (message.text ?? "").trim()

  // Comandos que não precisam de conta vinculada
  if (text === "/start" || text === "/meuid") {
    await sendTelegramMessage(
      chatId,
      `Olá! Seu Chat ID é:\n\n<b>${chatId}</b>\n\nCopie esse número e cole no PagaFácil para vincular sua conta ou fazer login.`
    )
    return NextResponse.json({ ok: true })
  }

  if (text === "/ajuda" || text === "/help") {
    await handleAjuda(chatId)
    return NextResponse.json({ ok: true })
  }

  // Comandos que precisam de conta vinculada
  const user = await findUserByChatId(chatId)

  if (!user) {
    await sendTelegramMessage(
      chatId,
      `⚠️ Seu Telegram não está vinculado a uma conta PagaFácil.\n\n` +
        `1. Acesse o app e vá em <b>Configurações</b>\n` +
        `2. Informe seu Chat ID: <b>${chatId}</b>\n` +
        `3. Depois volte aqui e use os comandos!`
    )
    return NextResponse.json({ ok: true })
  }

  if (text === "/contas") {
    await handleContas(chatId, user.id)
  } else if (text.startsWith("/nova")) {
    const args = text.slice(5).trim()
    await handleNova(chatId, user.id, args)
  } else if (text === "/pagar") {
    await handlePagar(chatId, user.id)
  } else if (/^\d+$/.test(text)) {
    // Pode ser resposta ao /pagar
    const handled = await handlePaySelection(chatId, user.id, parseInt(text, 10))
    if (!handled) {
      // Número solto sem sessão ativa — ignora silenciosamente
    }
  }

  return NextResponse.json({ ok: true })
}
