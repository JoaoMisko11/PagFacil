import { describe, it, expect } from "vitest"
import {
  scoreAmount,
  scoreDate,
  scoreDescription,
  scoreMatch,
  similarity,
  hasSignificantWordOverlap,
  decideFromScore,
  findBestMatch,
} from "@/lib/transaction-match"

describe("scoreAmount", () => {
  it("retorna 40 para valor exato", () => {
    expect(scoreAmount(-15000, 15000)).toBe(40)
  })
  it("retorna 35 para diferença de até R$ 0,50", () => {
    expect(scoreAmount(-14975, 15000)).toBe(35)
    expect(scoreAmount(-15050, 15000)).toBe(35)
  })
  it("retorna 30 para diferença de até 2%", () => {
    expect(scoreAmount(-15200, 15000)).toBe(30) // 1.33%
  })
  it("retorna 20 para diferença de até 5%", () => {
    expect(scoreAmount(-15700, 15000)).toBe(20) // 4.67%
  })
  it("retorna 0 para diferença > 5%", () => {
    expect(scoreAmount(-20000, 15000)).toBe(0)
  })
  it("trata sinais (débito vs crédito) absolutamente", () => {
    expect(scoreAmount(15000, 15000)).toBe(40) // mesmo sinal positivo
    expect(scoreAmount(-15000, -15000)).toBe(40)
  })
  it("retorna 0 quando bill amount é 0", () => {
    expect(scoreAmount(-100, 0)).toBe(0)
  })
})

describe("scoreDate", () => {
  const due = new Date("2026-04-15T12:00:00Z")

  it("retorna 30 para mesma data", () => {
    expect(scoreDate(new Date("2026-04-15T12:00:00Z"), due)).toBe(30)
  })
  it("retorna 30 para diferença de 1 dia (qualquer direção)", () => {
    expect(scoreDate(new Date("2026-04-14T12:00:00Z"), due)).toBe(30)
    expect(scoreDate(new Date("2026-04-16T12:00:00Z"), due)).toBe(30)
  })
  it("retorna 25 para diferença de 2-3 dias", () => {
    expect(scoreDate(new Date("2026-04-12T12:00:00Z"), due)).toBe(25)
    expect(scoreDate(new Date("2026-04-18T12:00:00Z"), due)).toBe(25)
  })
  it("retorna 20 para diferença de 4-7 dias", () => {
    expect(scoreDate(new Date("2026-04-10T12:00:00Z"), due)).toBe(20)
    expect(scoreDate(new Date("2026-04-22T12:00:00Z"), due)).toBe(20)
  })
  it("retorna 15 para pagamento antecipado em 8-14 dias", () => {
    expect(scoreDate(new Date("2026-04-05T12:00:00Z"), due)).toBe(15) // 10 dias antes
  })
  it("retorna 0 para datas muito distantes", () => {
    expect(scoreDate(new Date("2026-03-01T12:00:00Z"), due)).toBe(0)
    expect(scoreDate(new Date("2026-05-01T12:00:00Z"), due)).toBe(0)
  })
})

describe("similarity (Levenshtein)", () => {
  it("retorna 1 para strings idênticas", () => {
    expect(similarity("enel", "enel")).toBe(1)
  })
  it("retorna 0 para strings completamente diferentes do mesmo tamanho", () => {
    expect(similarity("abc", "xyz")).toBe(0)
  })
  it("retorna ≥0.7 para strings parecidas", () => {
    expect(similarity("netflix", "netflx")).toBeGreaterThanOrEqual(0.7)
  })
  it("retorna 0 para uma string vazia", () => {
    expect(similarity("", "abc")).toBe(0)
    expect(similarity("abc", "")).toBe(0)
  })
})

describe("hasSignificantWordOverlap", () => {
  it("identifica palavra ≥4 chars em comum", () => {
    expect(hasSignificantWordOverlap("pix enel sao paulo", "enel distribuicao")).toBe(true)
  })
  it("ignora palavras curtas (<4 chars)", () => {
    expect(hasSignificantWordOverlap("pag de boleto", "pix de tarifa")).toBe(false)
  })
  it("retorna false sem overlap", () => {
    expect(hasSignificantWordOverlap("netflix assinatura", "spotify premium")).toBe(false)
  })
})

describe("scoreDescription", () => {
  it("retorna 30 quando supplier é substring da descrição", () => {
    expect(scoreDescription("PAG BOLETO ENEL SP", "Enel")).toBe(30)
  })
  it("retorna 20 para alta similaridade", () => {
    expect(scoreDescription("netflx", "Netflix")).toBe(20)
  })
  it("retorna 10 para overlap de palavra significativa", () => {
    expect(scoreDescription("pagamento energia eletrica", "Energia Distribuidora")).toBe(10)
  })
  it("retorna 0 sem qualquer match", () => {
    expect(scoreDescription("Restaurante XYZ", "Aluguel")).toBe(0)
  })
})

describe("scoreMatch (integrado)", () => {
  it("score perfeito = 100", () => {
    const tx = {
      amount: -15000,
      date: new Date("2026-04-15T12:00:00Z"),
      description: "PAG BOLETO ENEL",
    }
    const bill = {
      id: "1",
      supplier: "Enel",
      amount: 15000,
      dueDate: new Date("2026-04-15T12:00:00Z"),
    }
    expect(scoreMatch(tx, bill)).toBe(100)
  })

  it("score baixo para match fraco", () => {
    const tx = {
      amount: -20000,
      date: new Date("2026-03-01T12:00:00Z"),
      description: "Restaurante",
    }
    const bill = {
      id: "1",
      supplier: "Enel",
      amount: 15000,
      dueDate: new Date("2026-04-15T12:00:00Z"),
    }
    expect(scoreMatch(tx, bill)).toBe(0)
  })
})

describe("decideFromScore", () => {
  it("≥80 → AUTO_MATCHED", () => {
    expect(decideFromScore(80)).toBe("AUTO_MATCHED")
    expect(decideFromScore(100)).toBe("AUTO_MATCHED")
  })
  it("50-79 → SUGGESTED", () => {
    expect(decideFromScore(50)).toBe("SUGGESTED")
    expect(decideFromScore(79)).toBe("SUGGESTED")
  })
  it("<50 → UNMATCHED", () => {
    expect(decideFromScore(49)).toBe("UNMATCHED")
    expect(decideFromScore(0)).toBe("UNMATCHED")
  })
})

describe("findBestMatch", () => {
  const tx = {
    amount: -15000,
    date: new Date("2026-04-15T12:00:00Z"),
    description: "PAG BOLETO ENEL SP",
  }

  it("retorna o melhor candidato acima do threshold", () => {
    const bills = [
      { id: "a", supplier: "Aluguel", amount: 200000, dueDate: new Date("2026-04-15") },
      { id: "b", supplier: "Enel", amount: 15000, dueDate: new Date("2026-04-15") },
      { id: "c", supplier: "Netflix", amount: 4990, dueDate: new Date("2026-04-15") },
    ]
    const result = findBestMatch(tx, bills)
    expect(result?.billId).toBe("b")
    expect(result?.score).toBeGreaterThanOrEqual(80)
  })

  it("retorna null quando nenhum candidato atinge SUGGEST_THRESHOLD (50)", () => {
    const bills = [
      { id: "a", supplier: "Aluguel", amount: 200000, dueDate: new Date("2026-03-01") },
      { id: "b", supplier: "Mercado XYZ", amount: 50000, dueDate: new Date("2026-05-30") },
    ]
    expect(findBestMatch(tx, bills)).toBeNull()
  })

  it("escolhe o mais alto entre dois candidatos próximos", () => {
    const bills = [
      // candidato 1: valor exato (40), mesma data (30), descrição alta similaridade Netflix→netfli (~20)
      { id: "x", supplier: "Netflx", amount: 15000, dueDate: new Date("2026-04-15") },
      // candidato 2: valor exato (40), mesma data (30), descrição substring perfeita Enel (30)
      { id: "y", supplier: "Enel", amount: 15000, dueDate: new Date("2026-04-15") },
    ]
    const result = findBestMatch(tx, bills)
    expect(result?.billId).toBe("y")
  })
})
