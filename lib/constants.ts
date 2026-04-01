export const CATEGORIES = [
  { value: "FIXO", label: "Fixo", icon: "🏠", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  { value: "VARIAVEL", label: "Variável", icon: "📊", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
  { value: "IMPOSTO", label: "Imposto", icon: "🏛️", color: "text-red-600 bg-red-50 dark:bg-red-950/30" },
  { value: "FORNECEDOR", label: "Fornecedor", icon: "🤝", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  { value: "ASSINATURA", label: "Assinatura", icon: "🔄", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
  { value: "OUTRO", label: "Outro", icon: "📋", color: "text-slate-600 bg-slate-50 dark:bg-slate-950/30" },
] as const

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c])
) as Record<string, (typeof CATEGORIES)[number]>

export const RECURRENCE_FREQUENCIES = [
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quinzenal" },
  { value: "MONTHLY", label: "Mensal" },
  { value: "YEARLY", label: "Anual" },
] as const
