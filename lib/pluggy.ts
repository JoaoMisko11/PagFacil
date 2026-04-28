/**
 * Wrapper para a API da Pluggy (Open Finance).
 * Auth via clientId/clientSecret → apiKey (TTL 2h, cache em memória).
 */

const BASE_URL = process.env.PLUGGY_BASE_URL ?? "https://api.pluggy.ai"

type AuthCache = { apiKey: string; expiresAt: number }
let authCache: AuthCache | null = null

async function getApiKey(): Promise<string> {
  const now = Date.now()
  if (authCache && authCache.expiresAt > now) {
    return authCache.apiKey
  }

  const clientId = process.env.PLUGGY_CLIENT_ID
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET devem estar configurados")
  }

  const res = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pluggy auth falhou: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { apiKey: string }
  // Pluggy apiKey TTL é 2h; expira em 110min para margem
  authCache = { apiKey: data.apiKey, expiresAt: now + 110 * 60 * 1000 }
  return data.apiKey
}

async function pluggyFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const apiKey = await getApiKey()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      ...(init.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pluggy ${init.method ?? "GET"} ${path} falhou: ${res.status} ${text}`)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// === Connect Token (para o widget Pluggy Connect) ===
export async function createConnectToken(options?: {
  itemId?: string // para reconectar item existente
  clientUserId?: string // permite buscar items do user via API depois
  webhookUrl?: string
}): Promise<{ accessToken: string }> {
  return pluggyFetch<{ accessToken: string }>("/connect_token", {
    method: "POST",
    body: JSON.stringify({
      itemId: options?.itemId,
      options: {
        clientUserId: options?.clientUserId,
        webhookUrl: options?.webhookUrl,
      },
    }),
  })
}

// === Items (conexões) ===
export type PluggyItemStatus =
  | "UPDATED"
  | "OUTDATED"
  | "LOGIN_ERROR"
  | "WAITING_USER_INPUT"
  | "UPDATING"
  | "WAITING_USER_ACTION"
  | "ERROR"

export interface PluggyConnector {
  id: number
  name: string
  imageUrl?: string
  primaryColor?: string
}

export interface PluggyItem {
  id: string
  status: PluggyItemStatus
  statusDetail?: string | null
  executionStatus?: string
  connector: PluggyConnector
  createdAt: string
  updatedAt: string
  lastUpdatedAt?: string | null
  clientUserId?: string | null
}

export async function getItem(itemId: string): Promise<PluggyItem> {
  return pluggyFetch<PluggyItem>(`/items/${itemId}`)
}

export async function deleteItem(itemId: string): Promise<void> {
  await pluggyFetch<void>(`/items/${itemId}`, { method: "DELETE" })
}

// === Accounts ===
export interface PluggyAccount {
  id: string
  type: "BANK" | "CREDIT"
  subtype: string // CHECKING_ACCOUNT | SAVINGS_ACCOUNT | CREDIT_CARD
  name: string
  number?: string
  balance: number // em reais (decimal)
  currencyCode: string
  itemId: string
}

export async function listAccounts(itemId: string): Promise<PluggyAccount[]> {
  const data = await pluggyFetch<{ results: PluggyAccount[] }>(`/accounts?itemId=${itemId}`)
  return data.results
}

// === Transactions ===
export interface PluggyTransaction {
  id: string
  accountId: string
  description: string
  descriptionRaw?: string | null
  amount: number // em reais (decimal); negativo = débito
  date: string // ISO
  category?: string | null
  type: "DEBIT" | "CREDIT"
  status?: "POSTED" | "PENDING"
}

interface PluggyPagedResult<T> {
  results: T[]
  page: number
  total: number
  totalPages: number
}

export async function listTransactions(params: {
  accountId: string
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
  page?: number
  pageSize?: number
}): Promise<PluggyPagedResult<PluggyTransaction>> {
  const qs = new URLSearchParams({
    accountId: params.accountId,
    pageSize: String(params.pageSize ?? 500),
    page: String(params.page ?? 1),
  })
  if (params.from) qs.set("from", params.from)
  if (params.to) qs.set("to", params.to)

  return pluggyFetch<PluggyPagedResult<PluggyTransaction>>(`/transactions?${qs.toString()}`)
}

/** Busca todas as transações de uma conta (paginação automática). */
export async function listAllTransactions(params: {
  accountId: string
  from?: string
  to?: string
}): Promise<PluggyTransaction[]> {
  const all: PluggyTransaction[] = []
  let page = 1
  while (true) {
    const result = await listTransactions({ ...params, page, pageSize: 500 })
    all.push(...result.results)
    if (page >= result.totalPages) break
    page += 1
  }
  return all
}
