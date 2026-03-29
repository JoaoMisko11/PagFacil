"use server"

import { z } from "zod"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const billSchema = z.object({
  supplier: z.string().min(1, "Fornecedor é obrigatório"),
  amount: z
    .string()
    .min(1, "Valor é obrigatório")
    .transform((val) => {
      const cleaned = val.replace(/[^\d,]/g, "").replace(",", ".")
      return Math.round(parseFloat(cleaned) * 100)
    })
    .refine((val) => val > 0, "Valor deve ser maior que zero"),
  dueDate: z.string().min(1, "Vencimento é obrigatório"),
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

  redirect("/bills")
}

export async function deleteBill(billId: string): Promise<void> {
  const userId = await getUserId()

  await db.bill.update({
    where: { id: billId, userId },
    data: { deletedAt: new Date() },
  })

  revalidatePath("/bills")
}

export async function markBillAsPaid(billId: string): Promise<void> {
  const userId = await getUserId()

  const bill = await db.bill.update({
    where: { id: billId, userId },
    data: { status: "PAID", paidAt: new Date() },
  })

  // Auto-gera próxima conta se recorrente (mensal)
  if (bill.isRecurring) {
    const nextDueDate = new Date(bill.dueDate)
    nextDueDate.setMonth(nextDueDate.getMonth() + 1)

    await db.bill.create({
      data: {
        supplier: bill.supplier,
        amount: bill.amount,
        dueDate: nextDueDate,
        category: bill.category,
        notes: bill.notes,
        isRecurring: true,
        userId,
      },
    })
  }

  revalidatePath("/bills")
  revalidatePath("/")
}

export async function markBillAsPending(billId: string): Promise<void> {
  const userId = await getUserId()

  await db.bill.update({
    where: { id: billId, userId },
    data: { status: "PENDING", paidAt: null },
  })

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

  await db.user.update({
    where: { id: userId },
    data: { name: name.trim() },
  })

  redirect("/onboarding?step=bill")
}

export async function submitFeedback(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getUserId()
  const type = (formData.get("type") as string) || "feature"
  const message = (formData.get("message") as string)?.trim()

  if (!message || message.length < 3) {
    return { errors: { message: ["Mensagem deve ter pelo menos 3 caracteres"] } }
  }

  await db.feedback.create({
    data: { type, message, userId },
  })

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

  redirect("/")
}
