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
  const notifyVia = formData.get("notifyVia") as string

  if (notifyVia === "telegram" && !telegramChatId) {
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
      notifyVia: notifyVia === "telegram" ? "telegram" : "email",
    },
  })

  revalidatePath("/settings")
  return { message: "Preferências salvas!" }
}
