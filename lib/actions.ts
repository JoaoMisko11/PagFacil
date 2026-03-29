"use server"

import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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
      // Calcula próximo vencimento sem overflow de mês
      // (ex: Jan 31 + 1 mês = Fev 28, não Mar 2)
      const d = new Date(bill.dueDate)
      const nextMonth = d.getMonth() + 1
      const nextDueDate = new Date(d.getFullYear(), nextMonth, d.getDate(), 12, 0, 0)
      // Se o dia estourou (ex: 31 fev → 3 mar), volta pro último dia do mês
      if (nextDueDate.getMonth() !== nextMonth % 12) {
        nextDueDate.setDate(0) // último dia do mês anterior
        nextDueDate.setHours(12, 0, 0, 0)
      }

      await db.$transaction([
        db.bill.update({
          where: { id: billId, userId },
          data: { status: "PAID", paidAt: new Date() },
        }),
        db.bill.create({
          data: {
            supplier: bill.supplier,
            amount: bill.amount,
            dueDate: nextDueDate,
            category: bill.category,
            notes: bill.notes,
            isRecurring: true,
            userId,
          },
        }),
      ])
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
        userId,
      },
    })
  } catch (error) {
    console.error("Erro ao criar conta (onboarding):", error)
    return { message: "Erro ao salvar conta. Tente novamente." }
  }

  redirect("/")
}
