import { describe, it, expect } from "vitest"
import { formatCurrency, formatDate, formatDateInput, formatCategory } from "@/lib/format"

describe("formatCurrency", () => {
  it("formata centavos para BRL", () => {
    expect(formatCurrency(15000)).toBe("R$\u00a0150,00")
  })

  it("formata valores com centavos", () => {
    expect(formatCurrency(9990)).toBe("R$\u00a099,90")
  })

  it("formata zero", () => {
    expect(formatCurrency(0)).toBe("R$\u00a00,00")
  })

  it("formata valores pequenos", () => {
    expect(formatCurrency(1)).toBe("R$\u00a00,01")
  })

  it("formata valores grandes", () => {
    expect(formatCurrency(1000000)).toBe("R$\u00a010.000,00")
  })
})

describe("formatDate", () => {
  it("formata data no padrão brasileiro", () => {
    const date = new Date("2025-01-15T12:00:00Z")
    const result = formatDate(date)
    expect(result).toBe("15/01/2025")
  })

  it("formata data em dezembro", () => {
    const date = new Date("2025-12-31T12:00:00Z")
    const result = formatDate(date)
    expect(result).toBe("31/12/2025")
  })
})

describe("formatDateInput", () => {
  it("retorna formato YYYY-MM-DD", () => {
    const date = new Date("2025-06-15T12:00:00Z")
    expect(formatDateInput(date)).toBe("2025-06-15")
  })
})

describe("formatCategory", () => {
  it("mapeia categorias conhecidas", () => {
    expect(formatCategory("FIXO")).toBe("Fixo")
    expect(formatCategory("VARIAVEL")).toBe("Variável")
    expect(formatCategory("IMPOSTO")).toBe("Imposto")
    expect(formatCategory("FORNECEDOR")).toBe("Fornecedor")
    expect(formatCategory("ASSINATURA")).toBe("Assinatura")
    expect(formatCategory("FUNCIONARIO")).toBe("Funcionário")
    expect(formatCategory("OUTRO")).toBe("Outro")
  })

  it("retorna valor original para categorias desconhecidas", () => {
    expect(formatCategory("CUSTOM")).toBe("CUSTOM")
  })
})
