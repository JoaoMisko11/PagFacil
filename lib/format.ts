export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(date)
}

export function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0]
}

const categoryLabels: Record<string, string> = {
  FIXO: "Fixo",
  VARIAVEL: "Variável",
  IMPOSTO: "Imposto",
  FORNECEDOR: "Fornecedor",
  ASSINATURA: "Assinatura",
  FUNCIONARIO: "Funcionário",
  OUTRO: "Outro",
}

export function formatCategory(category: string): string {
  return categoryLabels[category] ?? category
}
