import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { syncBankConnection } from "@/lib/bank-sync"

interface PluggyWebhookEvent {
  event: string // "item/created" | "item/updated" | "item/error" | "transactions/created" | etc
  itemId?: string
  clientId?: string
  triggeredBy?: string
  createdAt?: string
}

/**
 * Webhook do Pluggy.
 * Eventos relevantes: item/updated, item/login_succeeded, transactions/created.
 * Em qualquer um deles, ressincronizamos a conexão pelo itemId.
 *
 * Pluggy entrega cada evento via POST. Como a URL do webhook é gerada por connect_token
 * (não é pública/divulgada), tratamos a URL como secret. Em produção, configure
 * PLUGGY_WEBHOOK_SECRET para validação adicional via header.
 */
export async function POST(request: Request) {
  const expectedSecret = process.env.PLUGGY_WEBHOOK_SECRET
  if (expectedSecret) {
    const headerSecret = request.headers.get("x-pluggy-webhook-secret")
    if (headerSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  let payload: PluggyWebhookEvent
  try {
    payload = (await request.json()) as PluggyWebhookEvent
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { event, itemId } = payload
  if (!itemId) {
    return NextResponse.json({ ok: true, ignored: "sem itemId" })
  }

  // Eventos que requerem resync
  const triggersResync = [
    "item/updated",
    "item/login_succeeded",
    "transactions/created",
    "transactions/updated",
  ]

  if (!triggersResync.includes(event)) {
    return NextResponse.json({ ok: true, ignored: event })
  }

  const connection = await db.bankConnection.findUnique({
    where: { pluggyItemId: itemId },
  })
  if (!connection) {
    // Item ainda não persistido — pode ser race com confirmBankConnection.
    return NextResponse.json({ ok: true, ignored: "connection não encontrada" })
  }

  try {
    const result = await syncBankConnection(connection.id, { initialDays: 30 })
    return NextResponse.json({ ok: true, event, itemId, ...result })
  } catch (e) {
    console.error("[pluggy/webhook] sync falhou:", e)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
