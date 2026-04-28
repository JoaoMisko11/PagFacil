/**
 * Funções puras para conversão de dados Pluggy → schema PagaFácil.
 * Sem deps de Prisma/next/auth — testáveis isoladamente.
 */

import type { BankAccountType } from "@prisma/client"

/** Converte valor decimal (R$) → centavos (Int). */
export function pluggyAmountToCents(amount: number): number {
  return Math.round(amount * 100)
}

/** Mapeia subtype Pluggy → enum BankAccountType do schema. Retorna null se for tipo não suportado. */
export function mapPluggySubtype(subtype: string): BankAccountType | null {
  const normalized = subtype.toUpperCase()
  if (normalized.includes("CHECKING")) return "CHECKING"
  if (normalized.includes("SAVINGS")) return "SAVINGS"
  if (normalized.includes("CREDIT")) return "CREDIT"
  return null
}

/** Mascara o número da conta para exibição segura (mostra só os últimos 4 dígitos). */
export function maskAccountNumber(number?: string | null): string | null {
  if (!number) return null
  const digits = number.replace(/\D/g, "")
  if (digits.length <= 4) return digits
  return `••••${digits.slice(-4)}`
}

/** Calcula data ISO (YYYY-MM-DD) N dias atrás (UTC). */
export function dateNDaysAgo(days: number, now: Date = new Date()): string {
  const d = new Date(now)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Normaliza descrição de transação para matching (lowercase, sem acentos, sem múltiplos espaços). */
export function normalizeDescription(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // mantém só letras, números, espaço
    .replace(/\s+/g, " ")
    .trim()
}
