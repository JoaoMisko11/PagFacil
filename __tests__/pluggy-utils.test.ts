import { describe, it, expect } from "vitest"
import {
  pluggyAmountToCents,
  mapPluggySubtype,
  maskAccountNumber,
  dateNDaysAgo,
  normalizeDescription,
} from "@/lib/pluggy-utils"

describe("pluggyAmountToCents", () => {
  it("converte 150.00 → 15000", () => {
    expect(pluggyAmountToCents(150.0)).toBe(15000)
  })
  it("converte -49.90 → -4990", () => {
    expect(pluggyAmountToCents(-49.9)).toBe(-4990)
  })
  it("arredonda 0.005 → 1 (banker's rounding via Math.round)", () => {
    expect(pluggyAmountToCents(0.005)).toBe(1)
  })
  it("converte 0 → 0", () => {
    expect(pluggyAmountToCents(0)).toBe(0)
  })
})

describe("mapPluggySubtype", () => {
  it("mapeia CHECKING_ACCOUNT → CHECKING", () => {
    expect(mapPluggySubtype("CHECKING_ACCOUNT")).toBe("CHECKING")
  })
  it("mapeia checking_account (lowercase) → CHECKING", () => {
    expect(mapPluggySubtype("checking_account")).toBe("CHECKING")
  })
  it("mapeia SAVINGS_ACCOUNT → SAVINGS", () => {
    expect(mapPluggySubtype("SAVINGS_ACCOUNT")).toBe("SAVINGS")
  })
  it("mapeia CREDIT_CARD → CREDIT", () => {
    expect(mapPluggySubtype("CREDIT_CARD")).toBe("CREDIT")
  })
  it("retorna null para tipo desconhecido", () => {
    expect(mapPluggySubtype("INVESTMENT")).toBe(null)
    expect(mapPluggySubtype("LOAN")).toBe(null)
  })
})

describe("maskAccountNumber", () => {
  it("mascara mostrando últimos 4 dígitos", () => {
    expect(maskAccountNumber("1234567890")).toBe("••••7890")
  })
  it("retorna número curto sem máscara", () => {
    expect(maskAccountNumber("1234")).toBe("1234")
  })
  it("retorna null para entrada nula", () => {
    expect(maskAccountNumber(null)).toBe(null)
    expect(maskAccountNumber(undefined)).toBe(null)
  })
  it("remove caracteres não-dígito antes de mascarar", () => {
    expect(maskAccountNumber("12-34-56-78-90")).toBe("••••7890")
  })
})

describe("dateNDaysAgo", () => {
  it("retorna data ISO de N dias atrás", () => {
    const now = new Date("2026-04-28T12:00:00Z")
    expect(dateNDaysAgo(7, now)).toBe("2026-04-21")
  })
  it("lida com virada de mês", () => {
    const now = new Date("2026-05-03T12:00:00Z")
    expect(dateNDaysAgo(7, now)).toBe("2026-04-26")
  })
  it("0 dias retorna hoje", () => {
    const now = new Date("2026-04-28T12:00:00Z")
    expect(dateNDaysAgo(0, now)).toBe("2026-04-28")
  })
})

describe("normalizeDescription", () => {
  it("remove acentos e converte para lowercase", () => {
    expect(normalizeDescription("Pagamento Energização")).toBe("pagamento energizacao")
  })
  it("colapsa múltiplos espaços", () => {
    expect(normalizeDescription("PAG    BOLETO   ENEL")).toBe("pag boleto enel")
  })
  it("substitui pontuação por espaço", () => {
    expect(normalizeDescription("PIX-ENVIADO/ENEL.SP")).toBe("pix enviado enel sp")
  })
  it("descarta acentos compostos (ç, ã)", () => {
    expect(normalizeDescription("Açaí São Paulo")).toBe("acai sao paulo")
  })
})
