"use server"

import crypto from "crypto"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sendTelegramMessage } from "@/lib/telegram"

const billSchema = z.object({
  supplier: z.string().trim().min(1, "Fornecedor é obrigatório"),
  amount: z
    .string()
    .min(1, "Valor é obrigatório")
    .transform((val) => {
      const cleaned = val.replace(/[^\d,]/g, "").replace(",", ".")
      return Math.round(parseFloat(cleaned) * 100)
    })
    .refine((val) => val > 0, "Valor deve ser maior que zero"),
  dueDate: z
    .string()
    .min(1, "Vencimento é obrigatório")
    .refine(
      (val) => !isNaN(new Date(val + "T00:00:00Z").getTime()),
      "Data de vencimento inválida"
    ),
  category: z.enum(["FIXO", "VARIAVEL", "IMPOSTO", "FORNECEDOR", "ASSINATURA", "OUTRO"]),
  notes: z.string().optional(),
  isRecurring: z.coerce.boolean().optional().default(false),
  recurrenceFrequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "YEARLY"]).optional(),
  recurrenceEndDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(new Date(val + "T00:00:00Z").getTime()),
      "Data de fim inválida"
    ),
})

export type ActionState = {
  errors?: Record<string, string[]>
  message?: string
}

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autenticado")
  return session.user.id
}

export async function createBill(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getUserId()

  const parsed = billSchema.safeParse({
    supplier: formData.get("supplier"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    category: formData.get("category"),
    notes: formData.get("notes"),
    isRecurring: formData.get("isRecurring") === "on",
    recurrenceFrequency: formData.get("recurrenceFrequency") || undefined,
    recurrenceEndDate: formData.get("recurrenceEndDate") || undefined,
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await db.bill.create({
      data: {
        supplier: parsed.data.supplier,
        amount: parsed.data.amount,
        dueDate: new Date(parsed.data.dueDate + "T12:00:00Z"),
        category: parsed.data.category,
        notes: parsed.data.notes || null,
        isRecurring: parsed.data.isRecurring,
        recurrenceFrequency: parsed.data.isRecurring ? (parsed.data.recurrenceFrequency ?? "MONTHLY") : null,
        recurrenceEndDate: parsed.data.isRecurring && parsed.data.recurrenceEndDate
          ? new Date(parsed.data.recurrenceEndDate + "T12:00:00Z")
          : null,
        userId,
      },
    })
  } catch (error) {
    console.error("Erro ao criar conta:", error)
    return { message: "Erro ao salvar conta. Tente novamente." }
  }

  redirect("/bills")
}

export async function updateBill(
  billId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getUserId()

  const parsed = billSchema.safeParse({
    supplier: formData.get("supplier"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    category: formData.get("category"),
    notes: formData.get("notes"),
    isRecurring: formData.get("isRecurring") === "on",
    recurrenceFrequency: formData.get("recurrenceFrequency") || undefined,
    recurrenceEndDate: formData.get("recurrenceEndDate") || undefined,
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await db.bill.update({
      where: { id: billId, userId },
      data: {
        supplier: parsed.data.supplier,
        amount: parsed.data.amount,
        dueDate: new Date(parsed.data.dueDate + "T12:00:00Z"),
        category: parsed.data.category,
        notes: parsed.data.notes || null,
        isRecurring: parsed.data.isRecurring,
        recurrenceFrequency: parsed.data.isRecurring ? (parsed.data.recurrenceFrequency ?? "MONTHLY") : null,
        recurrenceEndDate: parsed.data.isRecurring && parsed.data.recurrenceEndDate
          ? new Date(parsed.data.recurrenceEndDate + "T12:00:00Z")
          : null,
      },
    })
  } catch (error) {
    console.error("Erro ao atualizar conta:", error)
    return { message: "Erro ao atualizar conta. Tente novamente." }
  }

  redirect("/bills")
}

export async function deleteBill(billId: string): Promise<void> {
  const userId = await getUserId()

  try {
    await db.bill.update({
      where: { id: billId, userId },
      data: { deletedAt: new Date() },
    })
  } catch (error) {
    console.error("Erro ao deletar conta:", error)
    throw error
  }

  revalidatePath("/bills")
}

export async function markBillAsPaid(billId: string): Promise<void> {
  const userId = await getUserId()

  try {
    const bill = await db.bill.findUniqueOrThrow({
      where: { id: billId, userId },
    })

    if (bill.isRecurring) {
      const d = new Date(bill.dueDate)
      const freq = bill.recurrenceFrequency ?? "MONTHLY"

      let nextDueDate: Date
      switch (freq) {
        case "WEEKLY":
          nextDueDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7, 12, 0, 0)
          break
        case "BIWEEKLY":
          nextDueDate = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 14, 12, 0, 0)
          break
        case "YEARLY":
          nextDueDate = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate(), 12, 0, 0)
          // Overflow check (ex: 29 fev em ano não-bissexto)
          if (nextDueDate.getMonth() !== d.getMonth()) {
            nextDueDate.setDate(0)
            nextDueDate.setHours(12, 0, 0, 0)
          }
          break
        case "MONTHLY":
        default: {
          const nextMonth = d.getMonth() + 1
          nextDueDate = new Date(d.getFullYear(), nextMonth, d.getDate(), 12, 0, 0)
          if (nextDueDate.getMonth() !== nextMonth % 12) {
            nextDueDate.setDate(0)
            nextDueDate.setHours(12, 0, 0, 0)
          }
          break
        }
      }

      // Se tem data de fim e a próxima parcela passaria dela, não cria
      const shouldCreateNext =
        !bill.recurrenceEndDate || nextDueDate <= bill.recurrenceEndDate

      const ops = [
        db.bill.update({
          where: { id: billId, userId },
          data: { status: "PAID", paidAt: new Date() },
        }),
      ]

      if (shouldCreateNext) {
        ops.push(
          db.bill.create({
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
        )
      }

      await db.$transaction(ops)
    } else {
      await db.bill.update({
        where: { id: billId, userId },
        data: { status: "PAID", paidAt: new Date() },
      })
    }
  } catch (error) {
    console.error("Erro ao marcar conta como paga:", error)
    throw error
  }

  revalidatePath("/bills")
  revalidatePath("/")
}

export async function markBillAsPending(billId: string): Promise<void> {
  const userId = await getUserId()

  try {
    await db.bill.update({
      where: { id: billId, userId },
      data: { status: "PENDING", paidAt: null },
    })
  } catch (error) {
    console.error("Erro ao desfazer pagamento:", error)
    throw error
  }

  revalidatePath("/bills")
  revalidatePath("/")
}

export async function updateUserName(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getUserId()
  const name = formData.get("name") as string

  if (!name || name.trim().length < 2) {
    return { errors: { name: ["Nome deve ter pelo menos 2 caracteres"] } }
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    })
  } catch (error) {
    console.error("Erro ao atualizar nome:", error)
    return { message: "Erro ao salvar nome. Tente novamente." }
  }

  redirect("/onboarding?step=bill")
}

export async function submitFeedback(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getUserId()
  const rawType = (formData.get("type") as string) || "feature"
  const type = ["feature", "bug", "other"].includes(rawType) ? rawType : "other"
  const message = (formData.get("message") as string)?.trim()

  if (!message || message.length < 3) {
    return { errors: { message: ["Mensagem deve ter pelo menos 3 caracteres"] } }
  }

  if (message.length > 5000) {
    return { errors: { message: ["Mensagem deve ter no máximo 5000 caracteres"] } }
  }

  try {
    await db.feedback.create({
      data: { type, message, userId },
    })
  } catch (error) {
    console.error("Erro ao salvar feedback:", error)
    return { message: "Erro ao enviar feedback. Tente novamente." }
  }

  return { message: "Obrigado pelo feedback!" }
}

export async function createBillOnboarding(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getUserId()

  const parsed = billSchema.safeParse({
    supplier: formData.get("supplier"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    category: formData.get("category"),
    notes: formData.get("notes"),
    isRecurring: formData.get("isRecurring") === "on",
    recurrenceFrequency: formData.get("recurrenceFrequency") || undefined,
    recurrenceEndDate: formData.get("recurrenceEndDate") || undefined,
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await db.bill.create({
      data: {
        supplier: parsed.data.supplier,
        amount: parsed.data.amount,
        dueDate: new Date(parsed.data.dueDate + "T12:00:00Z"),
        category: parsed.data.category,
        notes: parsed.data.notes || null,
        isRecurring: parsed.data.isRecurring,
        recurrenceFrequency: parsed.data.isRecurring ? (parsed.data.recurrenceFrequency ?? "MONTHLY") : null,
        recurrenceEndDate: parsed.data.isRecurring && parsed.data.recurrenceEndDate
          ? new Date(parsed.data.recurrenceEndDate + "T12:00:00Z")
          : null,
        userId,
      },
    })
  } catch (error) {
    console.error("Erro ao criar conta (onboarding):", error)
    return { message: "Erro ao salvar conta. Tente novamente." }
  }

  redirect("/")
}

// --- Importação de planilha ---

export type ImportBillRow = {
  row: number
  supplier: string
  amount: string
  dueDate: string
  category: string
  notes: string
  valid: boolean
  error?: string
}

export type ImportResult = {
  rows?: ImportBillRow[]
  imported?: number
  message?: string
}

const VALID_CATEGORIES = ["FIXO", "VARIAVEL", "IMPOSTO", "FORNECEDOR", "ASSINATURA", "OUTRO"]

function parseBrazilianDate(value: string): string | null {
  // Aceita DD/MM/AAAA ou DD-MM-AAAA
  const match = value.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  const d = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00Z`)
  if (isNaN(d.getTime())) return null
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

function parseBrazilianAmount(value: string): number {
  // Remove R$, espaços, pontos de milhar, troca vírgula por ponto
  const cleaned = value.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".")
  const num = parseFloat(cleaned)
  if (isNaN(num) || num <= 0) return 0
  return Math.round(num * 100)
}

function normalizeCategory(value: string): string | null {
  const upper = value.trim().toUpperCase()
  // Mapeamento flexível
  const map: Record<string, string> = {
    FIXO: "FIXO", FIXA: "FIXO", FIX: "FIXO",
    VARIAVEL: "VARIAVEL", VARIÁVEL: "VARIAVEL", VAR: "VARIAVEL",
    IMPOSTO: "IMPOSTO", IMP: "IMPOSTO", TAXA: "IMPOSTO",
    FORNECEDOR: "FORNECEDOR", FORN: "FORNECEDOR",
    ASSINATURA: "ASSINATURA", ASS: "ASSINATURA",
    OUTRO: "OUTRO", OUTROS: "OUTRO", OTHER: "OUTRO",
  }
  return map[upper] ?? (VALID_CATEGORIES.includes(upper) ? upper : null)
}

export async function parseSpreadsheet(
  _prevState: ImportResult,
  formData: FormData
): Promise<ImportResult> {
  const file = formData.get("file") as File | null
  if (!file || file.size === 0) {
    return { message: "Selecione um arquivo." }
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { message: "Arquivo muito grande. Máximo 5MB." }
  }

  const { read, utils } = await import("xlsx")

  const buffer = await file.arrayBuffer()
  let workbook
  try {
    workbook = read(buffer, { type: "array" })
  } catch {
    return { message: "Não foi possível ler o arquivo. Verifique o formato." }
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) return { message: "Planilha vazia." }

  const rawRows = utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" })
  if (rawRows.length === 0) return { message: "Nenhuma linha encontrada na planilha." }
  if (rawRows.length > 500) return { message: "Máximo de 500 contas por importação." }

  // Mapeia headers flexivelmente
  const firstRow = rawRows[0]
  const headers = Object.keys(firstRow)

  function findHeader(candidates: string[]): string | null {
    return headers.find((h) =>
      candidates.some((c) => h.toLowerCase().includes(c))
    ) ?? null
  }

  const supplierCol = findHeader(["fornecedor", "supplier", "nome", "descrição", "descricao"])
  const amountCol = findHeader(["valor", "amount", "preço", "preco", "total"])
  const dueDateCol = findHeader(["vencimento", "data", "due", "prazo"])
  const categoryCol = findHeader(["categoria", "category", "tipo", "type"])
  const notesCol = findHeader(["obs", "observação", "observacao", "notes", "nota"])

  if (!supplierCol || !amountCol || !dueDateCol) {
    return {
      message: `Colunas obrigatórias não encontradas. A planilha precisa ter: Fornecedor, Valor, Vencimento. Colunas encontradas: ${headers.join(", ")}`,
    }
  }

  const rows: ImportBillRow[] = rawRows.map((raw, i) => {
    const supplier = String(raw[supplierCol] ?? "").trim()
    const amountStr = String(raw[amountCol] ?? "").trim()
    const dueDateStr = String(raw[dueDateCol] ?? "").trim()
    const categoryStr = String(raw[categoryCol ?? ""] ?? "").trim()
    const notesStr = String(raw[notesCol ?? ""] ?? "").trim()

    const errors: string[] = []
    if (!supplier) errors.push("Fornecedor vazio")

    const amountCents = parseBrazilianAmount(amountStr)
    if (amountCents <= 0) errors.push("Valor inválido")

    const parsedDate = parseBrazilianDate(dueDateStr)
    if (!parsedDate) errors.push("Data inválida (use DD/MM/AAAA)")

    let category = "OUTRO"
    if (categoryStr) {
      const normalized = normalizeCategory(categoryStr)
      if (normalized) {
        category = normalized
      } else {
        errors.push(`Categoria desconhecida: ${categoryStr}`)
      }
    }

    return {
      row: i + 2, // +2 porque linha 1 é header, e humanos contam de 1
      supplier,
      amount: amountStr,
      dueDate: dueDateStr,
      category,
      notes: notesStr,
      valid: errors.length === 0,
      error: errors.length > 0 ? errors.join("; ") : undefined,
    }
  })

  return { rows }
}

export async function importBills(rows: ImportBillRow[]): Promise<ImportResult> {
  const userId = await getUserId()

  const validRows = rows.filter((r) => r.valid)
  if (validRows.length === 0) {
    return { message: "Nenhuma conta válida para importar." }
  }

  try {
    await db.bill.createMany({
      data: validRows.map((r) => ({
        supplier: r.supplier,
        amount: parseBrazilianAmount(r.amount),
        dueDate: new Date(parseBrazilianDate(r.dueDate)! + "T12:00:00Z"),
        category: normalizeCategory(r.category) as "FIXO" | "VARIAVEL" | "IMPOSTO" | "FORNECEDOR" | "ASSINATURA" | "OUTRO",
        notes: r.notes || null,
        isRecurring: false,
        userId,
      })),
    })
  } catch (error) {
    console.error("Erro ao importar contas:", error)
    return { message: "Erro ao salvar contas. Tente novamente." }
  }

  revalidatePath("/bills")
  revalidatePath("/")
  return { imported: validRows.length }
}

// --- Cadastro em lote ---

export type BatchBillInput = {
  supplier: string
  amount: string
  dueDate: string
  category: string
  notes: string
  isRecurring: boolean
  recurrenceFrequency: string
  recurrenceEndDate: string
}

export type BatchResult = {
  created?: number
  errors?: { row: number; fields: Record<string, string> }[]
  message?: string
}

export async function createBillsBatch(bills: BatchBillInput[]): Promise<BatchResult> {
  const userId = await getUserId()

  if (bills.length === 0) {
    return { message: "Nenhuma conta para cadastrar." }
  }
  if (bills.length > 100) {
    return { message: "Máximo de 100 contas por vez." }
  }

  const errors: { row: number; fields: Record<string, string> }[] = []
  const validBills: { supplier: string; amount: number; dueDate: string; category: string; notes: string | null; isRecurring: boolean; recurrenceFrequency: string | null; recurrenceEndDate: string | null }[] = []

  for (let i = 0; i < bills.length; i++) {
    const b = bills[i]
    const fieldErrors: Record<string, string> = {}

    const supplier = b.supplier.trim()
    if (!supplier) fieldErrors.supplier = "Obrigatório"

    const cleaned = b.amount.replace(/[^\d,]/g, "").replace(",", ".")
    const amountCents = Math.round(parseFloat(cleaned) * 100)
    if (!b.amount.trim() || isNaN(amountCents) || amountCents <= 0) fieldErrors.amount = "Valor inválido"

    const dueDate = b.dueDate.trim()
    if (!dueDate || isNaN(new Date(dueDate + "T00:00:00Z").getTime())) fieldErrors.dueDate = "Data inválida"

    if (!VALID_CATEGORIES.includes(b.category)) fieldErrors.category = "Categoria inválida"

    if (Object.keys(fieldErrors).length > 0) {
      errors.push({ row: i, fields: fieldErrors })
    } else {
      validBills.push({
        supplier,
        amount: amountCents,
        dueDate,
        category: b.category,
        notes: b.notes.trim() || null,
        isRecurring: b.isRecurring,
        recurrenceFrequency: b.isRecurring ? b.recurrenceFrequency : null,
        recurrenceEndDate: b.isRecurring && b.recurrenceEndDate.trim() ? b.recurrenceEndDate.trim() : null,
      })
    }
  }

  if (errors.length > 0) {
    return { errors }
  }

  try {
    await db.bill.createMany({
      data: validBills.map((b) => ({
        supplier: b.supplier,
        amount: b.amount,
        dueDate: new Date(b.dueDate + "T12:00:00Z"),
        category: b.category as "FIXO" | "VARIAVEL" | "IMPOSTO" | "FORNECEDOR" | "ASSINATURA" | "OUTRO",
        notes: b.notes,
        isRecurring: b.isRecurring,
        recurrenceFrequency: b.recurrenceFrequency as "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "YEARLY" | null,
        recurrenceEndDate: b.recurrenceEndDate ? new Date(b.recurrenceEndDate + "T12:00:00Z") : null,
        userId,
      })),
    })
  } catch (error) {
    console.error("Erro ao cadastrar contas em lote:", error)
    return { message: "Erro ao salvar contas. Tente novamente." }
  }

  revalidatePath("/bills")
  revalidatePath("/")
  return { created: validBills.length }
}

// --- Telegram OTP ---

export async function sendTelegramOtp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const chatId = (formData.get("chatId") as string)?.trim()

  if (!chatId || !/^\d+$/.test(chatId)) {
    return { errors: { chatId: ["Chat ID inválido. Deve conter apenas números."] } }
  }

  // Limpa OTPs expirados/usados
  await db.telegramOtp.deleteMany({
    where: {
      OR: [
        { expires: { lt: new Date() } },
        { chatId, used: true },
      ],
    },
  })

  const code = crypto.randomInt(100000, 999999).toString()
  const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 min

  // Busca usuário existente (se houver)
  const existingUser = await db.user.findUnique({
    where: { telegramChatId: chatId },
  })

  await db.telegramOtp.create({
    data: {
      chatId,
      code,
      expires,
      userId: existingUser?.id ?? null,
    },
  })

  const sent = await sendTelegramMessage(
    chatId,
    `Seu código de acesso ao PagaFácil:\n\n<b>${code}</b>\n\nVálido por 10 minutos.`
  )

  if (!sent) {
    return {
      errors: {
        chatId: [
          "Não conseguimos enviar a mensagem. Verifique o Chat ID e se você já iniciou conversa com @pagafacil_bot.",
        ],
      },
    }
  }

  return { message: "Código enviado! Verifique seu Telegram." }
}

// --- Configurações de notificação ---

export async function updateNotificationPreferences(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getUserId()
  const telegramChatId = (formData.get("telegramChatId") as string)?.trim() || null
  const notifyViaValues = formData.getAll("notifyVia") as string[]
  const notifyVia = notifyViaValues.filter((v) => ["email", "telegram"].includes(v)).join(",")

  if (!notifyVia) {
    return { errors: { notifyVia: ["Selecione pelo menos um canal de notificação"] } }
  }

  if (notifyVia.includes("telegram") && !telegramChatId) {
    return { errors: { telegramChatId: ["Informe seu Chat ID do Telegram"] } }
  }

  // Valida enviando mensagem de teste
  if (telegramChatId) {
    const sent = await sendTelegramMessage(
      telegramChatId,
      "PagaFácil conectado com sucesso! Você receberá lembretes por aqui."
    )
    if (!sent) {
      return {
        errors: {
          telegramChatId: [
            "Não conseguimos enviar mensagem. Verifique o Chat ID e se você iniciou conversa com @pagafacil_bot.",
          ],
        },
      }
    }
  }

  // Verifica se o Chat ID já está vinculado a outra conta
  if (telegramChatId) {
    const existing = await db.user.findUnique({
      where: { telegramChatId },
      select: { id: true },
    })
    if (existing && existing.id !== userId) {
      return {
        errors: {
          telegramChatId: [
            "Este Chat ID já está vinculado a outra conta.",
          ],
        },
      }
    }
  }

  await db.user.update({
    where: { id: userId },
    data: {
      telegramChatId,
      notifyVia,
    },
  })

  revalidatePath("/settings")
  return { message: "Preferências salvas!" }
}
