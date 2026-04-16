// Pure functions for insights calculations — no Next.js/Prisma deps

export interface BillData {
  supplier: string
  amount: number // centavos
  category: string
  dueDate: Date
  status: string
  paidAt: Date | null
  isRecurring: boolean
}

export interface CategoryBreakdown {
  category: string
  total: number // centavos
  count: number
  percentage: number // 0-100
}

export interface SupplierRanking {
  supplier: string
  total: number // centavos
  count: number
}

export interface MonthlyComparison {
  label: string // "Jan", "Fev", etc.
  year: number
  month: number // 0-indexed
  total: number // centavos
  paidOnTime: number
  paidLate: number
  pending: number
}

export interface PunctualityStats {
  total: number
  onTime: number
  late: number
  percentage: number // 0-100
}

export interface InsightMessage {
  type: "saving" | "alert" | "trend" | "tip"
  title: string
  message: string
}

/**
 * Groups bills by category and calculates totals + percentages
 */
export function computeCategoryBreakdown(bills: BillData[]): CategoryBreakdown[] {
  const map = new Map<string, { total: number; count: number }>()

  for (const bill of bills) {
    const entry = map.get(bill.category) ?? { total: 0, count: 0 }
    entry.total += bill.amount
    entry.count++
    map.set(bill.category, entry)
  }

  const grandTotal = bills.reduce((sum, b) => sum + b.amount, 0)

  return Array.from(map.entries())
    .map(([category, { total, count }]) => ({
      category,
      total,
      count,
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Ranks suppliers by total spending
 */
export function computeTopSuppliers(bills: BillData[], limit = 5): SupplierRanking[] {
  const map = new Map<string, { total: number; count: number }>()

  for (const bill of bills) {
    const key = bill.supplier.trim().toLowerCase()
    const entry = map.get(key) ?? { total: 0, count: 0 }
    entry.total += bill.amount
    entry.count++
    map.set(key, entry)
  }

  return Array.from(map.entries())
    .map(([supplier, { total, count }]) => ({ supplier, total, count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}

/**
 * Calculates punctuality stats: how many bills were paid on time vs late
 */
export function computePunctuality(bills: BillData[]): PunctualityStats {
  const paid = bills.filter((b) => b.status === "PAID" && b.paidAt)
  const onTime = paid.filter((b) => {
    const deadline = new Date(b.dueDate.getTime() + 86400000) // end of due day
    return b.paidAt! <= deadline
  })

  return {
    total: paid.length,
    onTime: onTime.length,
    late: paid.length - onTime.length,
    percentage: paid.length > 0 ? Math.round((onTime.length / paid.length) * 100) : 0,
  }
}

/**
 * Groups bills by month and calculates totals
 */
export function computeMonthlyComparison(bills: BillData[], months = 6): MonthlyComparison[] {
  const now = new Date()
  const result: MonthlyComparison[] = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const start = new Date(year, month, 1, 0, 0, 0)
    const end = new Date(year, month + 1, 0, 23, 59, 59)

    const monthBills = bills.filter((b) => b.dueDate >= start && b.dueDate <= end)
    const total = monthBills.reduce((sum, b) => sum + b.amount, 0)

    const paid = monthBills.filter((b) => b.status === "PAID" && b.paidAt)
    const paidOnTime = paid.filter((b) => {
      const deadline = new Date(b.dueDate.getTime() + 86400000)
      return b.paidAt! <= deadline
    })

    const pending = monthBills.filter((b) => b.status === "PENDING")

    const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")

    result.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      year,
      month,
      total,
      paidOnTime: paidOnTime.reduce((sum, b) => sum + b.amount, 0),
      paidLate: paid.filter((b) => {
        const deadline = new Date(b.dueDate.getTime() + 86400000)
        return b.paidAt! > deadline
      }).reduce((sum, b) => sum + b.amount, 0),
      pending: pending.reduce((sum, b) => sum + b.amount, 0),
    })
  }

  return result
}

/**
 * Calculates month-over-month variation percentage
 */
export function computeMonthVariation(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Estimates next month spending based on recurring bills + average variable spending
 */
export function computeForecast(
  bills: BillData[],
  recurringBills: BillData[],
): { recurring: number; estimated: number; total: number } {
  // Sum recurring bill amounts
  const recurring = recurringBills.reduce((sum, b) => sum + b.amount, 0)

  // Average non-recurring spending from past 3 months
  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const recentNonRecurring = bills.filter(
    (b) => !b.isRecurring && b.dueDate >= threeMonthsAgo && b.dueDate < new Date(now.getFullYear(), now.getMonth(), 1)
  )

  const monthsWithData = new Set(
    recentNonRecurring.map((b) => `${b.dueDate.getFullYear()}-${b.dueDate.getMonth()}`)
  ).size

  const estimated = monthsWithData > 0
    ? Math.round(recentNonRecurring.reduce((sum, b) => sum + b.amount, 0) / monthsWithData)
    : 0

  return { recurring, estimated, total: recurring + estimated }
}

/**
 * Generates smart insight messages based on bill data
 */
export function generateInsightMessages(
  categoryBreakdown: CategoryBreakdown[],
  punctuality: PunctualityStats,
  monthlyComparison: MonthlyComparison[],
  forecast: { recurring: number; estimated: number; total: number },
): InsightMessage[] {
  const messages: InsightMessage[] = []

  // Top category insight
  if (categoryBreakdown.length > 0) {
    const top = categoryBreakdown[0]
    if (top.percentage >= 40) {
      messages.push({
        type: "alert",
        title: "Concentracao de gastos",
        message: `${top.percentage}% dos seus gastos sao em "${top.category}". Diversificar pode reduzir riscos.`,
      })
    }
  }

  // Punctuality insight
  if (punctuality.total >= 3) {
    if (punctuality.percentage >= 90) {
      messages.push({
        type: "tip",
        title: "Excelente pontualidade",
        message: `Voce pagou ${punctuality.percentage}% das contas em dia. Continue assim!`,
      })
    } else if (punctuality.percentage < 70) {
      messages.push({
        type: "alert",
        title: "Atencao com prazos",
        message: `Apenas ${punctuality.percentage}% das contas foram pagas em dia. Ative lembretes para nao perder prazos.`,
      })
    }
  }

  // Month-over-month trend
  if (monthlyComparison.length >= 2) {
    const current = monthlyComparison[monthlyComparison.length - 1]
    const previous = monthlyComparison[monthlyComparison.length - 2]
    const variation = computeMonthVariation(current.total, previous.total)

    if (variation !== null) {
      if (variation > 20) {
        messages.push({
          type: "trend",
          title: "Gastos em alta",
          message: `Seus gastos subiram ${variation}% em relacao ao mes anterior.`,
        })
      } else if (variation < -10) {
        messages.push({
          type: "saving",
          title: "Economia detectada",
          message: `Seus gastos cairam ${Math.abs(variation)}% em relacao ao mes anterior. Bom trabalho!`,
        })
      }
    }
  }

  return messages
}
