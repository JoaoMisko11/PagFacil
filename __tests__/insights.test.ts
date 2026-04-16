import { describe, it, expect } from "vitest"
import {
  computeCategoryBreakdown,
  computeTopSuppliers,
  computePunctuality,
  computeMonthlyComparison,
  computeMonthVariation,
  computeForecast,
  generateInsightMessages,
  type BillData,
} from "@/lib/insights-utils"

// Helper to create bill data
function makeBill(overrides: Partial<BillData> = {}): BillData {
  return {
    supplier: "Fornecedor A",
    amount: 10000, // R$100
    category: "FIXO",
    dueDate: new Date("2026-04-10T12:00:00Z"),
    status: "PAID",
    paidAt: new Date("2026-04-09T12:00:00Z"),
    isRecurring: false,
    ...overrides,
  }
}

describe("computeCategoryBreakdown", () => {
  it("returns empty array for no bills", () => {
    expect(computeCategoryBreakdown([])).toEqual([])
  })

  it("groups bills by category with totals and percentages", () => {
    const bills = [
      makeBill({ category: "FIXO", amount: 20000 }),
      makeBill({ category: "FIXO", amount: 10000 }),
      makeBill({ category: "VARIAVEL", amount: 10000 }),
      makeBill({ category: "IMPOSTO", amount: 10000 }),
    ]
    const result = computeCategoryBreakdown(bills)

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ category: "FIXO", total: 30000, count: 2, percentage: 60 })
    expect(result[1].category).toBe("VARIAVEL")
    expect(result[2].category).toBe("IMPOSTO")
  })

  it("sorts by total descending", () => {
    const bills = [
      makeBill({ category: "IMPOSTO", amount: 5000 }),
      makeBill({ category: "FIXO", amount: 50000 }),
    ]
    const result = computeCategoryBreakdown(bills)
    expect(result[0].category).toBe("FIXO")
    expect(result[1].category).toBe("IMPOSTO")
  })

  it("handles single category", () => {
    const bills = [makeBill({ category: "ASSINATURA", amount: 3000 })]
    const result = computeCategoryBreakdown(bills)
    expect(result).toHaveLength(1)
    expect(result[0].percentage).toBe(100)
  })
})

describe("computeTopSuppliers", () => {
  it("returns empty array for no bills", () => {
    expect(computeTopSuppliers([])).toEqual([])
  })

  it("ranks suppliers by total spending", () => {
    const bills = [
      makeBill({ supplier: "Netflix", amount: 4000 }),
      makeBill({ supplier: "Aluguel", amount: 200000 }),
      makeBill({ supplier: "Netflix", amount: 4000 }),
      makeBill({ supplier: "Luz", amount: 15000 }),
    ]
    const result = computeTopSuppliers(bills)
    expect(result[0].supplier).toBe("aluguel")
    expect(result[0].total).toBe(200000)
    expect(result[1].supplier).toBe("luz")
    expect(result[2].supplier).toBe("netflix")
    expect(result[2].count).toBe(2)
  })

  it("respects limit parameter", () => {
    const bills = Array.from({ length: 10 }, (_, i) =>
      makeBill({ supplier: `Supplier ${i}`, amount: (10 - i) * 1000 })
    )
    const result = computeTopSuppliers(bills, 3)
    expect(result).toHaveLength(3)
  })

  it("normalizes supplier names (case insensitive, trimmed)", () => {
    const bills = [
      makeBill({ supplier: "Netflix", amount: 4000 }),
      makeBill({ supplier: " netflix ", amount: 4000 }),
    ]
    const result = computeTopSuppliers(bills)
    expect(result).toHaveLength(1)
    expect(result[0].total).toBe(8000)
  })
})

describe("computePunctuality", () => {
  it("returns zero stats for no bills", () => {
    expect(computePunctuality([])).toEqual({
      total: 0, onTime: 0, late: 0, percentage: 0,
    })
  })

  it("counts on-time payments correctly", () => {
    const bills = [
      makeBill({ dueDate: new Date("2026-04-10T12:00:00Z"), paidAt: new Date("2026-04-10T12:00:00Z"), status: "PAID" }),
      makeBill({ dueDate: new Date("2026-04-10T12:00:00Z"), paidAt: new Date("2026-04-09T12:00:00Z"), status: "PAID" }),
      makeBill({ dueDate: new Date("2026-04-10T12:00:00Z"), paidAt: new Date("2026-04-15T12:00:00Z"), status: "PAID" }),
    ]
    const result = computePunctuality(bills)
    expect(result.total).toBe(3)
    expect(result.onTime).toBe(2)
    expect(result.late).toBe(1)
    expect(result.percentage).toBe(67)
  })

  it("ignores pending bills", () => {
    const bills = [
      makeBill({ status: "PENDING", paidAt: null }),
      makeBill({ status: "PAID", paidAt: new Date("2026-04-09T12:00:00Z") }),
    ]
    const result = computePunctuality(bills)
    expect(result.total).toBe(1)
  })
})

describe("computeMonthVariation", () => {
  it("returns null when previous is zero", () => {
    expect(computeMonthVariation(10000, 0)).toBeNull()
  })

  it("calculates positive variation", () => {
    expect(computeMonthVariation(12000, 10000)).toBe(20)
  })

  it("calculates negative variation", () => {
    expect(computeMonthVariation(8000, 10000)).toBe(-20)
  })

  it("returns 0 for no change", () => {
    expect(computeMonthVariation(10000, 10000)).toBe(0)
  })
})

describe("computeForecast", () => {
  it("returns zeros when no data", () => {
    const result = computeForecast([], [])
    expect(result).toEqual({ recurring: 0, estimated: 0, total: 0 })
  })

  it("sums recurring bills", () => {
    const recurring = [
      makeBill({ amount: 10000, isRecurring: true }),
      makeBill({ amount: 5000, isRecurring: true }),
    ]
    const result = computeForecast([], recurring)
    expect(result.recurring).toBe(15000)
    expect(result.total).toBe(15000)
  })

  it("estimates variable spending from past 3 months", () => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 15)

    const bills = [
      makeBill({ amount: 20000, isRecurring: false, dueDate: lastMonth }),
      makeBill({ amount: 10000, isRecurring: false, dueDate: twoMonthsAgo }),
    ]
    const result = computeForecast(bills, [])
    expect(result.estimated).toBe(15000) // average of 20000 + 10000 over 2 months
  })
})

describe("computeMonthlyComparison", () => {
  it("returns correct number of months", () => {
    const result = computeMonthlyComparison([], 3)
    expect(result).toHaveLength(3)
  })

  it("groups bills into correct months", () => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15, 12, 0, 0)

    const bills = [
      makeBill({ amount: 10000, dueDate: thisMonth, status: "PAID", paidAt: new Date(thisMonth.getTime() - 86400000) }),
      makeBill({ amount: 5000, dueDate: thisMonth, status: "PENDING", paidAt: null }),
    ]
    const result = computeMonthlyComparison(bills, 1)
    expect(result).toHaveLength(1)
    expect(result[0].total).toBe(15000)
    expect(result[0].paidOnTime).toBe(10000)
    expect(result[0].pending).toBe(5000)
  })
})

describe("generateInsightMessages", () => {
  it("returns empty array when no notable patterns", () => {
    const breakdown = [{ category: "FIXO", total: 10000, count: 1, percentage: 30 }]
    const punctuality = { total: 1, onTime: 1, late: 0, percentage: 100 }
    const monthly = [{ label: "Abr", year: 2026, month: 3, total: 10000, paidOnTime: 10000, paidLate: 0, pending: 0 }]
    const forecast = { recurring: 0, estimated: 0, total: 0 }

    const result = generateInsightMessages(breakdown, punctuality, monthly, forecast)
    // With only 1 bill in punctuality (< 3) and only 1 month, no insights generated
    expect(result.length).toBe(0)
  })

  it("generates concentration alert when top category >= 40%", () => {
    const breakdown = [{ category: "FIXO", total: 50000, count: 5, percentage: 80 }]
    const punctuality = { total: 0, onTime: 0, late: 0, percentage: 0 }
    const monthly: any[] = []
    const forecast = { recurring: 0, estimated: 0, total: 0 }

    const result = generateInsightMessages(breakdown, punctuality, monthly, forecast)
    expect(result.some((m) => m.type === "alert" && m.title === "Concentracao de gastos")).toBe(true)
  })

  it("generates punctuality praise when >= 90%", () => {
    const breakdown: any[] = []
    const punctuality = { total: 10, onTime: 9, late: 1, percentage: 90 }
    const monthly: any[] = []
    const forecast = { recurring: 0, estimated: 0, total: 0 }

    const result = generateInsightMessages(breakdown, punctuality, monthly, forecast)
    expect(result.some((m) => m.type === "tip" && m.title === "Excelente pontualidade")).toBe(true)
  })

  it("generates punctuality alert when < 70%", () => {
    const breakdown: any[] = []
    const punctuality = { total: 10, onTime: 5, late: 5, percentage: 50 }
    const monthly: any[] = []
    const forecast = { recurring: 0, estimated: 0, total: 0 }

    const result = generateInsightMessages(breakdown, punctuality, monthly, forecast)
    expect(result.some((m) => m.type === "alert" && m.title === "Atencao com prazos")).toBe(true)
  })

  it("generates trend alert when spending increases > 20%", () => {
    const breakdown: any[] = []
    const punctuality = { total: 0, onTime: 0, late: 0, percentage: 0 }
    const monthly = [
      { label: "Mar", year: 2026, month: 2, total: 10000, paidOnTime: 10000, paidLate: 0, pending: 0 },
      { label: "Abr", year: 2026, month: 3, total: 15000, paidOnTime: 15000, paidLate: 0, pending: 0 },
    ]
    const forecast = { recurring: 0, estimated: 0, total: 0 }

    const result = generateInsightMessages(breakdown, punctuality, monthly, forecast)
    expect(result.some((m) => m.type === "trend" && m.title === "Gastos em alta")).toBe(true)
  })

  it("generates saving message when spending decreases > 10%", () => {
    const breakdown: any[] = []
    const punctuality = { total: 0, onTime: 0, late: 0, percentage: 0 }
    const monthly = [
      { label: "Mar", year: 2026, month: 2, total: 20000, paidOnTime: 20000, paidLate: 0, pending: 0 },
      { label: "Abr", year: 2026, month: 3, total: 10000, paidOnTime: 10000, paidLate: 0, pending: 0 },
    ]
    const forecast = { recurring: 0, estimated: 0, total: 0 }

    const result = generateInsightMessages(breakdown, punctuality, monthly, forecast)
    expect(result.some((m) => m.type === "saving" && m.title === "Economia detectada")).toBe(true)
  })
})
