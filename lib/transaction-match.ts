/**
 * Engine de matching transação bancária → conta a pagar.
 *
 * Regras de score (0-100):
 *   - Valor (40 pts):  exato=40, ±R$0,50=35, ±2%=30, ±5%=20, else 0
 *   - Data (30 pts):   ±1d=30, ±3d=25, ±7d=20, ±14d (antes do vencimento)=15, else 0
 *   - Descrição (30): substring exata=30, similaridade ≥0.7=20, ≥1 palavra comum=10, else 0
 *
 * Decisão:
 *   - score ≥ 80 → AUTO_MATCHED (marca bill como paga)
 *   - 50 ≤ score < 80 → SUGGESTED (aguarda confirmação)
 *   - score < 50 → UNMATCHED
 *
 * Funções puras — sem deps de Prisma/auth.
 */

import { normalizeDescription } from "@/lib/pluggy-utils"

export const AUTO_MATCH_THRESHOLD = 80
export const SUGGEST_THRESHOLD = 50

export interface MatchableBill {
  id: string
  supplier: string
  amount: number // centavos
  dueDate: Date
}

export interface MatchableTransaction {
  amount: number // centavos (negativo = débito)
  date: Date
  description: string
}

/** Score de proximidade de valores absolutos (em centavos). */
export function scoreAmount(txAmount: number, billAmount: number): number {
  const a = Math.abs(txAmount)
  const b = Math.abs(billAmount)
  if (b === 0) return 0
  const diff = Math.abs(a - b)
  if (diff <= 1) return 40
  if (diff <= 50) return 35 // R$ 0,50
  if (diff / b <= 0.02) return 30
  if (diff / b <= 0.05) return 20
  return 0
}

/** Score de proximidade da data da transação à dueDate da conta. */
export function scoreDate(txDate: Date, dueDate: Date): number {
  const dayMs = 24 * 60 * 60 * 1000
  const diffDays = Math.round((txDate.getTime() - dueDate.getTime()) / dayMs)
  const abs = Math.abs(diffDays)
  if (abs <= 1) return 30
  if (abs <= 3) return 25
  if (abs <= 7) return 20
  // Pago com bastante antecedência (até 14 dias antes do vencimento)
  if (diffDays >= -14 && diffDays < -7) return 15
  return 0
}

/** Distância de Levenshtein normalizada (0..1, onde 1 = igual). */
export function similarity(a: string, b: string): number {
  if (!a.length || !b.length) return 0
  if (a === b) return 1
  const m = a.length
  const n = b.length
  // matriz de distância
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }
  const maxLen = Math.max(m, n)
  return 1 - dp[m][n] / maxLen
}

/** Verifica se há pelo menos uma palavra significativa (≥4 chars) em comum. */
export function hasSignificantWordOverlap(a: string, b: string): boolean {
  const wordsA = new Set(a.split(" ").filter((w) => w.length >= 4))
  for (const w of b.split(" ")) {
    if (w.length >= 4 && wordsA.has(w)) return true
  }
  return false
}

/** Score de proximidade de descrição vs supplier. */
export function scoreDescription(txDescription: string, supplier: string): number {
  const tx = normalizeDescription(txDescription)
  const sup = normalizeDescription(supplier)
  if (!tx || !sup) return 0
  if (tx.includes(sup) || sup.includes(tx)) return 30
  if (similarity(tx, sup) >= 0.7) return 20
  if (hasSignificantWordOverlap(tx, sup)) return 10
  return 0
}

/** Score total (0-100) de uma transação contra uma conta. */
export function scoreMatch(
  tx: MatchableTransaction,
  bill: MatchableBill
): number {
  return (
    scoreAmount(tx.amount, bill.amount) +
    scoreDate(tx.date, bill.dueDate) +
    scoreDescription(tx.description, bill.supplier)
  )
}

export type MatchDecision = "AUTO_MATCHED" | "SUGGESTED" | "UNMATCHED"

export function decideFromScore(score: number): MatchDecision {
  if (score >= AUTO_MATCH_THRESHOLD) return "AUTO_MATCHED"
  if (score >= SUGGEST_THRESHOLD) return "SUGGESTED"
  return "UNMATCHED"
}

/** Encontra a melhor conta entre candidatas. Retorna null se nenhum score ≥ SUGGEST_THRESHOLD. */
export function findBestMatch(
  tx: MatchableTransaction,
  candidates: MatchableBill[]
): { billId: string; score: number } | null {
  let best: { billId: string; score: number } | null = null
  for (const bill of candidates) {
    const score = scoreMatch(tx, bill)
    if (score >= SUGGEST_THRESHOLD && (!best || score > best.score)) {
      best = { billId: bill.id, score }
    }
  }
  return best
}
