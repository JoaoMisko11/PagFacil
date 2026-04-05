"use server"

import crypto from "crypto"
import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sendTelegramMessage } from "@/lib/telegram"
import { getFamilyUserIds } from "@/lib/family"

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
  category: z.enum(["FIXO", "VARIAVEL", "IMPOSTO", "FORNECEDOR", "ASSINATURA", "FUNCIONARIO", "OUTRO"]),
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

const RECURRING_HORIZON_DAYS = 90

function computeNextDueDate(current: Date, freq: string): Date {
  const d = new Date(current)
  switch (freq) {
    case "WEEKLY":
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7, 12, 0, 0)
    case "BIWEEKLY":
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 14, 12, 0, 0)
    case "YEARLY": {
      const next = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate(), 12, 0, 0)
      if (next.getMonth() !== d.getMonth()) {
        next.setDate(0)
        next.setHours(12, 0, 0, 0)
      }
      return next
    }
    case "MONTHLY":
    default: {
      const nextMonth = d.getMonth() + 1
      const next = new Date(d.getFullYear(), nextMonth, d.getDate(), 12, 0, 0)
      if (next.getMonth() !== nextMonth % 12) {
        next.setDate(0)
        next.setHours(12, 0, 0, 0)
      }
      return next
    }
  }
}

function generateFutureDates(
  startDate: Date,
  freq: string,
  endDate: Date | null,
): Date[] {
  const horizon = new Date()
  horizon.setDate(horizon.getDate() + RECURRING_HORIZON_DAYS)
  horizon.setHours(23, 59, 59, 999)

  const limit = endDate && endDate < horizon ? endDate : horizon
  const dates: Date[] = []
  let current = startDate

  while (true) {
    const next = computeNextDueDate(current, freq)
    if (next > limit) break
    dates.push(next)
    current = next
  }

  return dates
}

async function getUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autenticado")
  return session.user.id
}

async function assertBillAccess(billId: string, userIds: string[]) {
  const bill = await db.bill.findFirst({
    where: { id: billId, userId: { in: userIds } },
  })
  if (!bill) throw new Error("Conta não encontrada")
  return bill
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

  const dueDate = new Date(parsed.data.dueDate + "T12:00:00Z")
  const freq = parsed.data.isRecurring ? (parsed.data.recurrenceFrequency ?? "MONTHLY") : null
  const endDate = parsed.data.isRecurring && parsed.data.recurrenceEndDate
    ? new Date(parsed.data.recurrenceEndDate + "T12:00:00Z")
    : null

  const baseBill = {
    supplier: parsed.data.supplier,
    amount: parsed.data.amount,
    category: parsed.data.category,
    notes: parsed.data.notes || null,
    isRecurring: parsed.data.isRecurring,
    recurrenceFrequency: freq,
    recurrenceEndDate: endDate,
    userId,
  }

  try {
    if (parsed.data.isRecurring && freq) {
      const futureDates = generateFutureDates(dueDate, freq, endDate)
      await db.bill.createMany({
        data: [
          { ...baseBill, dueDate },
          ...futureDates.map((d) => ({ ...baseBill, dueDate: d })),
        ],
      })
    } else {
      await db.bill.create({ data: { ...baseBill, dueDate } })
    }
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
  const userIds = await getFamilyUserIds(userId)

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
    await assertBillAccess(billId, userIds)
    await db.bill.update({
      where: { id: billId },
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
  const userIds = await getFamilyUserIds(userId)

  try {
    await assertBillAccess(billId, userIds)
    await db.bill.update({
      where: { id: billId },
      data: { deletedAt: new Date() },
    })
  } catch (error) {
    console.error("Erro ao deletar conta:", error)
    throw error
  }

  revalidatePath("/bills")
}

export async function restoreBill(billId: string): Promise<void> {
  const userId = await getUserId()
  const userIds = await getFamilyUserIds(userId)

  try {
    await assertBillAccess(billId, userIds)
    await db.bill.update({
      where: { id: billId },
      data: { deletedAt: null },
    })
  } catch (error) {
    console.error("Erro ao restaurar conta:", error)
    throw error
  }

  revalidatePath("/bills")
  revalidatePath("/bills/trash")
}

export async function markBillAsPaid(billId: string): Promise<{ remainingPending: number }> {
  const userId = await getUserId()
  const userIds = await getFamilyUserIds(userId)

  try {
    const bill = await assertBillAccess(billId, userIds)

    if (bill.isRecurring) {
      const freq = bill.recurrenceFrequency ?? "MONTHLY"

      // Busca a última parcela pendente para saber até onde já existem instâncias
      const lastPending = await db.bill.findFirst({
        where: {
          userId: { in: userIds },
          supplier: bill.supplier,
          isRecurring: true,
          deletedAt: null,
          status: "PENDING",
          id: { not: billId },
        },
        orderBy: { dueDate: "desc" },
      })

      const lastDate = lastPending?.dueDate ?? bill.dueDate
      const futureDates = generateFutureDates(lastDate, freq, bill.recurrenceEndDate)

      const ops = [
        db.bill.update({
          where: { id: billId },
          data: { status: "PAID", paidAt: new Date() },
        }),
        ...futureDates.map((d) =>
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
              userId: bill.userId, // mantém o dono original
            },
          })
        ),
      ]

      await db.$transaction(ops)
    } else {
      await db.bill.update({
        where: { id: billId },
        data: { status: "PAID", paidAt: new Date() },
      })
    }
  } catch (error) {
    console.error("Erro ao marcar conta como paga:", error)
    throw error
  }

  const remainingPending = await db.bill.count({
    where: { userId: { in: userIds }, deletedAt: null, status: "PENDING" },
  })

  revalidatePath("/bills")
  revalidatePath("/")
  return { remainingPending }
}

export async function markBillAsPending(billId: string): Promise<void> {
  const userId = await getUserId()
  const userIds = await getFamilyUserIds(userId)

  try {
    await assertBillAccess(billId, userIds)
    await db.bill.update({
      where: { id: billId },
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

  const dueDate = new Date(parsed.data.dueDate + "T12:00:00Z")
  const freq = parsed.data.isRecurring ? (parsed.data.recurrenceFrequency ?? "MONTHLY") : null
  const endDate = parsed.data.isRecurring && parsed.data.recurrenceEndDate
    ? new Date(parsed.data.recurrenceEndDate + "T12:00:00Z")
    : null

  const baseBill = {
    supplier: parsed.data.supplier,
    amount: parsed.data.amount,
    category: parsed.data.category,
    notes: parsed.data.notes || null,
    isRecurring: parsed.data.isRecurring,
    recurrenceFrequency: freq,
    recurrenceEndDate: endDate,
    userId,
  }

  try {
    if (parsed.data.isRecurring && freq) {
      const futureDates = generateFutureDates(dueDate, freq, endDate)
      await db.bill.createMany({
        data: [
          { ...baseBill, dueDate },
          ...futureDates.map((d) => ({ ...baseBill, dueDate: d })),
        ],
      })
    } else {
      await db.bill.create({ data: { ...baseBill, dueDate } })
    }
  } catch (error) {
    console.error("Erro ao criar conta (onboarding):", error)
    return { message: "Erro ao salvar conta. Tente novamente." }
  }

  redirect("/onboarding?step=reminders")
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

const VALID_CATEGORIES = ["FIXO", "VARIAVEL", "IMPOSTO", "FORNECEDOR", "ASSINATURA", "FUNCIONARIO", "OUTRO"]

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

  if (rows.length === 0) {
    return { message: "Nenhuma conta para importar." }
  }
  if (rows.length > 500) {
    return { message: "Máximo de 500 contas por importação." }
  }

  // Re-valida todas as rows server-side (não confia no flag `valid` do client)
  type ValidBill = { supplier: string; amount: number; dueDate: string; category: string; notes: string | null }
  const validBills: ValidBill[] = []

  for (const r of rows) {
    const supplier = r.supplier?.trim()
    if (!supplier) continue

    const amount = parseBrazilianAmount(r.amount)
    if (amount <= 0) continue

    const parsedDate = parseBrazilianDate(r.dueDate)
    if (!parsedDate) continue

    const category = normalizeCategory(r.category || "OUTRO")
    if (!category) continue

    validBills.push({
      supplier,
      amount,
      dueDate: parsedDate,
      category,
      notes: r.notes?.trim() || null,
    })
  }

  if (validBills.length === 0) {
    return { message: "Nenhuma conta válida para importar." }
  }

  try {
    await db.bill.createMany({
      data: validBills.map((b) => ({
        supplier: b.supplier,
        amount: b.amount,
        dueDate: new Date(b.dueDate + "T12:00:00Z"),
        category: b.category as "FIXO" | "VARIAVEL" | "IMPOSTO" | "FORNECEDOR" | "ASSINATURA" | "FUNCIONARIO" | "OUTRO",
        notes: b.notes,
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
  return { imported: validBills.length }
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
    type CategoryType = "FIXO" | "VARIAVEL" | "IMPOSTO" | "FORNECEDOR" | "ASSINATURA" | "FUNCIONARIO" | "OUTRO"
    type FreqType = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "YEARLY" | null

    const allBillsData = validBills.flatMap((b) => {
      const dueDate = new Date(b.dueDate + "T12:00:00Z")
      const endDate = b.recurrenceEndDate ? new Date(b.recurrenceEndDate + "T12:00:00Z") : null
      const base = {
        supplier: b.supplier,
        amount: b.amount,
        category: b.category as CategoryType,
        notes: b.notes,
        isRecurring: b.isRecurring,
        recurrenceFrequency: b.recurrenceFrequency as FreqType,
        recurrenceEndDate: endDate,
        userId,
      }

      if (b.isRecurring && b.recurrenceFrequency) {
        const futureDates = generateFutureDates(dueDate, b.recurrenceFrequency, endDate)
        return [
          { ...base, dueDate },
          ...futureDates.map((d) => ({ ...base, dueDate: d })),
        ]
      }
      return [{ ...base, dueDate }]
    })

    await db.bill.createMany({ data: allBillsData })
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

  // Rate limit: max 3 OTPs ativos por chatId (anti-spam)
  const activeOtps = await db.telegramOtp.count({
    where: { chatId, used: false, expires: { gt: new Date() } },
  })

  if (activeOtps >= 3) {
    return {
      errors: {
        chatId: ["Muitas tentativas. Aguarde o código anterior expirar (10 min) e tente novamente."],
      },
    }
  }

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
  const notifyVia = notifyViaValues.filter((v) => ["email", "telegram", "push"].includes(v)).join(",")

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

// --- Push Subscription ---

export async function savePushSubscription(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  const userId = await getUserId()

  await db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId,
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId,
    },
  })

  // Garante que "push" está no notifyVia
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { notifyVia: true },
  })
  const channels = user.notifyVia.split(",").filter(Boolean)
  if (!channels.includes("push")) {
    channels.push("push")
    await db.user.update({
      where: { id: userId },
      data: { notifyVia: channels.join(",") },
    })
  }

  revalidatePath("/settings")
  return { ok: true }
}

export async function removePushSubscription(endpoint: string) {
  const userId = await getUserId()

  await db.pushSubscription.deleteMany({
    where: { endpoint, userId },
  })

  // Se não tem mais subscriptions, remove "push" do notifyVia
  const remaining = await db.pushSubscription.count({ where: { userId } })
  if (remaining === 0) {
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { notifyVia: true },
    })
    const channels = user.notifyVia.split(",").filter((c) => c !== "push")
    await db.user.update({
      where: { id: userId },
      data: { notifyVia: channels.join(",") || "email" },
    })
  }

  revalidatePath("/settings")
  return { ok: true }
}

// --- Enviar lembretes agora ---

export async function sendMyRemindersNow(): Promise<ActionState> {
  const userId = await getUserId()

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      telegramChatId: true,
      notifyVia: true,
      pushSubscriptions: { select: { endpoint: true, p256dh: true, auth: true } },
    },
  })

  const channels = user.notifyVia.split(",")

  // Busca contas pendentes: vencidas + vencendo nos próximos 7 dias
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000)

  const bills = await db.bill.findMany({
    where: {
      userId,
      status: "PENDING",
      deletedAt: null,
      dueDate: { lte: sevenDaysFromNow },
    },
    orderBy: { dueDate: "asc" },
  })

  if (bills.length === 0) {
    return { message: "Nenhuma conta pendente para notificar!" }
  }

  const count = bills.length
  const today = new Date(now.toISOString().split("T")[0] + "T00:00:00Z")
  const overdue = bills.filter((b) => b.dueDate < today)
  const upcoming = bills.filter((b) => b.dueDate >= today)

  function formatBillLine(b: { supplier: string; amount: number; dueDate: Date }) {
    const date = b.dueDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    return `${b.supplier} — R$ ${(b.amount / 100).toFixed(2).replace(".", ",")} (${date})`
  }

  let sent = 0
  const errors: string[] = []

  // Telegram
  if (channels.includes("telegram") && user.telegramChatId) {
    const { escapeHtml } = await import("@/lib/telegram")
    const safeName = user.name ? escapeHtml(user.name) : null
    let msg = `Olá${safeName ? `, ${safeName}` : ""}!\n\n`

    if (overdue.length > 0) {
      msg += `<b>Vencidas (${overdue.length}):</b>\n`
      msg += overdue.map((b) => `• ${escapeHtml(formatBillLine(b))}`).join("\n")
      msg += "\n\n"
    }
    if (upcoming.length > 0) {
      msg += `<b>Próximos 7 dias (${upcoming.length}):</b>\n`
      msg += upcoming.map((b) => `• ${escapeHtml(formatBillLine(b))}`).join("\n")
    }

    try {
      await sendTelegramMessage(user.telegramChatId, msg)
      sent++
    } catch {
      errors.push("Telegram")
    }
  }

  // Email
  if (channels.includes("email")) {
    try {
      const nodemailer = (await import("nodemailer")).default
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      })

      let text = `Olá${user.name ? `, ${user.name}` : ""}!\n\n`
      if (overdue.length > 0) {
        text += `VENCIDAS (${overdue.length}):\n`
        text += overdue.map((b) => `• ${formatBillLine(b)}`).join("\n")
        text += "\n\n"
      }
      if (upcoming.length > 0) {
        text += `PRÓXIMOS 7 DIAS (${upcoming.length}):\n`
        text += upcoming.map((b) => `• ${formatBillLine(b)}`).join("\n")
      }
      text += `\n\nAcesse: ${process.env.NEXTAUTH_URL ?? "https://paga-facil.vercel.app"}\n\n— PagaFácil`

      const subject = overdue.length > 0
        ? `${overdue.length} conta${overdue.length > 1 ? "s" : ""} vencida${overdue.length > 1 ? "s" : ""} + ${upcoming.length} próxima${upcoming.length > 1 ? "s" : ""}`
        : `${count} conta${count > 1 ? "s" : ""} pendente${count > 1 ? "s" : ""}`

      await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
        to: user.email,
        subject,
        text,
      })
      sent++
    } catch {
      errors.push("Email")
    }
  }

  // Push
  if (channels.includes("push") && user.pushSubscriptions.length > 0) {
    try {
      const webpush = (await import("web-push")).default
      webpush.setVapidDetails(
        "mailto:" + (process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? "noreply@pagafacil.app"),
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      )

      const pushBody = overdue.length > 0
        ? `${overdue.length} vencida${overdue.length > 1 ? "s" : ""}, ${upcoming.length} próxima${upcoming.length > 1 ? "s" : ""}`
        : `${count} conta${count > 1 ? "s" : ""} pendente${count > 1 ? "s" : ""} nos próximos 7 dias`

      const payload = JSON.stringify({
        title: "PagaFácil - Resumo",
        body: pushBody,
        tag: "pagafacil-manual-reminder",
        url: "/pagamentos",
      })

      for (const sub of user.pushSubscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
          sent++
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode
          if (statusCode === 410 || statusCode === 404) {
            await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {})
          }
        }
      }
    } catch {
      errors.push("Push")
    }
  }

  if (sent === 0 && errors.length > 0) {
    return { errors: { _form: [`Falha ao enviar via: ${errors.join(", ")}`] } }
  }

  const channelNames = []
  if (channels.includes("telegram") && user.telegramChatId) channelNames.push("Telegram")
  if (channels.includes("email")) channelNames.push("Email")
  if (channels.includes("push") && user.pushSubscriptions.length > 0) channelNames.push("Push")

  return {
    message: `Lembrete enviado! ${count} conta${count > 1 ? "s" : ""} via ${channelNames.join(", ")}${errors.length > 0 ? ` (falha em: ${errors.join(", ")})` : ""}`
  }
}
