import { describe, it, expect, vi, afterEach } from "vitest"
import { computeNextDueDate, generateFutureDates } from "@/lib/bill-utils"

describe("computeNextDueDate", () => {
  it("avança 7 dias para WEEKLY", () => {
    const current = new Date(2025, 0, 1, 12, 0, 0) // 1 Jan 2025
    const next = computeNextDueDate(current, "WEEKLY")
    expect(next.getDate()).toBe(8)
    expect(next.getMonth()).toBe(0)
    expect(next.getFullYear()).toBe(2025)
  })

  it("avança 14 dias para BIWEEKLY", () => {
    const current = new Date(2025, 0, 1, 12, 0, 0)
    const next = computeNextDueDate(current, "BIWEEKLY")
    expect(next.getDate()).toBe(15)
    expect(next.getMonth()).toBe(0)
  })

  it("avança 1 mês para MONTHLY", () => {
    const current = new Date(2025, 0, 15, 12, 0, 0) // 15 Jan
    const next = computeNextDueDate(current, "MONTHLY")
    expect(next.getDate()).toBe(15)
    expect(next.getMonth()).toBe(1) // Fev
  })

  it("ajusta dia 31 para meses com menos dias (MONTHLY)", () => {
    const current = new Date(2025, 0, 31, 12, 0, 0) // 31 Jan
    const next = computeNextDueDate(current, "MONTHLY")
    // Fev não tem 31 dias — deve cair no último dia de Fev
    expect(next.getMonth()).toBe(1)
    expect(next.getDate()).toBe(28)
  })

  it("avança 1 ano para YEARLY", () => {
    const current = new Date(2025, 5, 15, 12, 0, 0) // 15 Jun 2025
    const next = computeNextDueDate(current, "YEARLY")
    expect(next.getDate()).toBe(15)
    expect(next.getMonth()).toBe(5)
    expect(next.getFullYear()).toBe(2026)
  })

  it("ajusta 29 Fev em ano não-bissexto (YEARLY)", () => {
    const current = new Date(2024, 1, 29, 12, 0, 0) // 29 Fev 2024 (bissexto)
    const next = computeNextDueDate(current, "YEARLY")
    // 2025 não é bissexto — deve cair em 28 Fev
    expect(next.getFullYear()).toBe(2025)
    expect(next.getMonth()).toBe(1)
    expect(next.getDate()).toBe(28)
  })

  it("usa MONTHLY como default para frequência desconhecida", () => {
    const current = new Date(2025, 0, 15, 12, 0, 0)
    const next = computeNextDueDate(current, "UNKNOWN")
    expect(next.getMonth()).toBe(1)
    expect(next.getDate()).toBe(15)
  })
})

describe("generateFutureDates", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("gera datas futuras dentro do horizonte de 90 dias", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 1, 12, 0, 0)) // 1 Jan 2025

    const start = new Date(2025, 0, 1, 12, 0, 0)
    const dates = generateFutureDates(start, "MONTHLY", null)

    expect(dates.length).toBe(3) // Fev, Mar, Abr (dentro de 90 dias)
    expect(dates[0].getMonth()).toBe(1) // Fev
    expect(dates[1].getMonth()).toBe(2) // Mar
    expect(dates[2].getMonth()).toBe(3) // Abr
  })

  it("respeita endDate quando é antes do horizonte", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 1, 12, 0, 0))

    const start = new Date(2025, 0, 1, 12, 0, 0)
    const endDate = new Date(2025, 1, 28, 23, 59, 59) // 28 Fev
    const dates = generateFutureDates(start, "MONTHLY", endDate)

    expect(dates.length).toBe(1) // Só Fev (Mar já passa endDate)
    expect(dates[0].getMonth()).toBe(1)
  })

  it("retorna vazio se startDate já está no fim do horizonte", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 1, 12, 0, 0))

    const start = new Date(2025, 3, 1, 12, 0, 0) // 1 Abr — horizonte é ~1 Abr
    const dates = generateFutureDates(start, "MONTHLY", null)

    expect(dates.length).toBe(0)
  })

  it("gera múltiplas datas para WEEKLY", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 1, 12, 0, 0))

    const start = new Date(2025, 0, 1, 12, 0, 0)
    const dates = generateFutureDates(start, "WEEKLY", null)

    // 90 dias / 7 dias ≈ 12-13 datas
    expect(dates.length).toBeGreaterThanOrEqual(12)
    expect(dates.length).toBeLessThanOrEqual(13)
  })
})
