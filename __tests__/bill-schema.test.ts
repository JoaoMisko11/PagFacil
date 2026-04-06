import { describe, it, expect } from "vitest"
import { billSchema } from "@/lib/bill-utils"

describe("billSchema", () => {
  const validBill = {
    supplier: "Fornecedor Teste",
    amount: "150,00",
    dueDate: "2025-06-15",
    category: "FIXO",
  }

  it("aceita dados válidos", () => {
    const result = billSchema.safeParse(validBill)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.supplier).toBe("Fornecedor Teste")
      expect(result.data.amount).toBe(15000) // centavos
      expect(result.data.category).toBe("FIXO")
    }
  })

  it("converte valor com vírgula para centavos", () => {
    const result = billSchema.safeParse({ ...validBill, amount: "99,90" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amount).toBe(9990)
    }
  })

  it("valor com ponto é tratado como separador de milhar (padrão BR)", () => {
    // A regex remove pontos, então "99.90" vira "9990" = R$ 99,90 em centavos? Não:
    // "99.90" → remove ponto → "9990" → replace vírgula → "9990" → parseFloat → 9990.00 → *100 = 999000
    const result = billSchema.safeParse({ ...validBill, amount: "99.90" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amount).toBe(999000)
    }
  })

  it("limpa R$ e espaços do valor", () => {
    const result = billSchema.safeParse({ ...validBill, amount: "R$ 1.500,00" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amount).toBe(150000)
    }
  })

  it("rejeita fornecedor vazio", () => {
    const result = billSchema.safeParse({ ...validBill, supplier: "" })
    expect(result.success).toBe(false)
  })

  it("rejeita fornecedor só com espaços", () => {
    const result = billSchema.safeParse({ ...validBill, supplier: "   " })
    expect(result.success).toBe(false)
  })

  it("rejeita valor zero", () => {
    const result = billSchema.safeParse({ ...validBill, amount: "0" })
    expect(result.success).toBe(false)
  })

  it("rejeita valor vazio", () => {
    const result = billSchema.safeParse({ ...validBill, amount: "" })
    expect(result.success).toBe(false)
  })

  it("rejeita data inválida", () => {
    const result = billSchema.safeParse({ ...validBill, dueDate: "abc" })
    expect(result.success).toBe(false)
  })

  it("rejeita data vazia", () => {
    const result = billSchema.safeParse({ ...validBill, dueDate: "" })
    expect(result.success).toBe(false)
  })

  it("rejeita categoria inválida", () => {
    const result = billSchema.safeParse({ ...validBill, category: "INVALIDA" })
    expect(result.success).toBe(false)
  })

  it("aceita todas as categorias válidas", () => {
    const categories = ["FIXO", "VARIAVEL", "IMPOSTO", "FORNECEDOR", "ASSINATURA", "FUNCIONARIO", "OUTRO"]
    for (const category of categories) {
      const result = billSchema.safeParse({ ...validBill, category })
      expect(result.success).toBe(true)
    }
  })

  it("aceita conta recorrente com frequência", () => {
    const result = billSchema.safeParse({
      ...validBill,
      isRecurring: true,
      recurrenceFrequency: "MONTHLY",
    })
    expect(result.success).toBe(true)
  })

  it("aceita conta recorrente com data de fim", () => {
    const result = billSchema.safeParse({
      ...validBill,
      isRecurring: true,
      recurrenceFrequency: "WEEKLY",
      recurrenceEndDate: "2025-12-31",
    })
    expect(result.success).toBe(true)
  })

  it("rejeita data de fim inválida", () => {
    const result = billSchema.safeParse({
      ...validBill,
      isRecurring: true,
      recurrenceFrequency: "MONTHLY",
      recurrenceEndDate: "not-a-date",
    })
    expect(result.success).toBe(false)
  })

  it("notes é opcional", () => {
    const result = billSchema.safeParse(validBill)
    expect(result.success).toBe(true)

    const withNotes = billSchema.safeParse({ ...validBill, notes: "Observação" })
    expect(withNotes.success).toBe(true)
  })

  it("isRecurring default é false", () => {
    const result = billSchema.safeParse(validBill)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isRecurring).toBe(false)
    }
  })
})
