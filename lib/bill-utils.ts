import { z } from "zod"

export const billSchema = z.object({
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

export const RECURRING_HORIZON_DAYS = 90

export function computeNextDueDate(current: Date, freq: string): Date {
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

export function generateFutureDates(
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
