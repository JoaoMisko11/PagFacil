import { describe, it, expect } from "vitest"
import { CATEGORIES, CATEGORY_MAP, RECURRENCE_FREQUENCIES } from "@/lib/constants"

describe("CATEGORIES", () => {
  it("contém 7 categorias", () => {
    expect(CATEGORIES).toHaveLength(7)
  })

  it("cada categoria tem value, label, icon e color", () => {
    for (const cat of CATEGORIES) {
      expect(cat.value).toBeTruthy()
      expect(cat.label).toBeTruthy()
      expect(cat.icon).toBeTruthy()
      expect(cat.color).toBeTruthy()
    }
  })

  it("valores são únicos", () => {
    const values = CATEGORIES.map((c) => c.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it("contém as categorias esperadas", () => {
    const values = CATEGORIES.map((c) => c.value)
    expect(values).toContain("FIXO")
    expect(values).toContain("VARIAVEL")
    expect(values).toContain("IMPOSTO")
    expect(values).toContain("FORNECEDOR")
    expect(values).toContain("ASSINATURA")
    expect(values).toContain("FUNCIONARIO")
    expect(values).toContain("OUTRO")
  })
})

describe("CATEGORY_MAP", () => {
  it("mapeia value para objeto completo", () => {
    expect(CATEGORY_MAP["FIXO"].label).toBe("Fixo")
    expect(CATEGORY_MAP["VARIAVEL"].label).toBe("Variável")
    expect(CATEGORY_MAP["OUTRO"].label).toBe("Outro")
  })

  it("tem mesma quantidade que CATEGORIES", () => {
    expect(Object.keys(CATEGORY_MAP)).toHaveLength(CATEGORIES.length)
  })
})

describe("RECURRENCE_FREQUENCIES", () => {
  it("contém 4 frequências", () => {
    expect(RECURRENCE_FREQUENCIES).toHaveLength(4)
  })

  it("contém as frequências esperadas", () => {
    const values = RECURRENCE_FREQUENCIES.map((f) => f.value)
    expect(values).toContain("WEEKLY")
    expect(values).toContain("BIWEEKLY")
    expect(values).toContain("MONTHLY")
    expect(values).toContain("YEARLY")
  })

  it("cada frequência tem value e label", () => {
    for (const freq of RECURRENCE_FREQUENCIES) {
      expect(freq.value).toBeTruthy()
      expect(freq.label).toBeTruthy()
    }
  })
})
