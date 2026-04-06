/**
 * Funções puras de parsing para o bot Telegram.
 * Extraídas de app/api/telegram/webhook/route.ts para testabilidade.
 */

const VALID_CATEGORIES = [
  "FIXO",
  "VARIAVEL",
  "IMPOSTO",
  "FORNECEDOR",
  "ASSINATURA",
  "FUNCIONARIO",
  "OUTRO",
] as const

export type TelegramCategory = (typeof VALID_CATEGORIES)[number]

/** Parseia data no formato DD/MM/AAAA para Date (12:00 UTC). Retorna null se inválida. */
export function parseDateBR(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null

  const [, dd, mm, yyyy] = match
  const date = new Date(`${yyyy}-${mm}-${dd}T12:00:00Z`)

  if (isNaN(date.getTime())) return null

  // Verifica se o dia/mês realmente bate (evita 31/02 → 03/03)
  if (date.getUTCDate() !== parseInt(dd) || date.getUTCMonth() + 1 !== parseInt(mm)) {
    return null
  }

  return date
}

/** Parseia valor monetário BR (ex: "150,00", "1.500,00", "1500") para centavos. Retorna null se inválido. */
export function parseAmount(valorStr: string): number | null {
  const cleaned = valorStr.replace(/[^\d,\.]/g, "").replace(",", ".")
  const amount = Math.round(parseFloat(cleaned) * 100)
  if (isNaN(amount) || amount <= 0) return null
  return amount
}

/**
 * Parseia argumentos do comando /nova.
 * Formato: "Fornecedor 150,00 15/04/2026 FIXO"
 * Retorna null se parsing falha, ou objeto com os campos parseados.
 */
export function parseNovaArgs(args: string): {
  supplier: string
  amount: number
  dueDate: Date
  category: TelegramCategory
} | null {
  if (!args.trim()) return null

  const parts = args.split(/\s+/)
  if (parts.length < 3) return null

  // Tenta detectar categoria (último item, se for válida)
  let category: TelegramCategory = "OUTRO"
  const lastUpper = parts[parts.length - 1].toUpperCase()
  if (VALID_CATEGORIES.includes(lastUpper as TelegramCategory)) {
    category = lastUpper as TelegramCategory
    parts.pop()
  }

  if (parts.length < 3) return null

  // Data é o último item
  const dateStr = parts.pop()!
  const dueDate = parseDateBR(dateStr)
  if (!dueDate) return null

  // Valor é o último item agora
  const valorStr = parts.pop()!
  const amount = parseAmount(valorStr)
  if (!amount) return null

  // O que sobrou é o fornecedor
  const supplier = parts.join(" ").trim()
  if (!supplier) return null

  return { supplier, amount, dueDate, category }
}

/** Formata centavos para string R$ (versão simples para Telegram, sem Intl). */
export function formatCurrencySimple(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}
