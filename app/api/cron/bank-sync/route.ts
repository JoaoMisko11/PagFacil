import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { syncBankConnection } from "@/lib/bank-sync"

/**
 * Sync diário de todas as BankConnections.
 * Roda 1x/dia (configurado em vercel.json) como fallback caso o webhook do Pluggy falhe.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const connections = await db.bankConnection.findMany({
    select: { id: true, pluggyItemId: true },
  })

  let synced = 0
  let failed = 0
  const results: Array<{ id: string; ok: boolean; error?: string }> = []

  for (const conn of connections) {
    try {
      await syncBankConnection(conn.id, { initialDays: 7 })
      synced += 1
      results.push({ id: conn.id, ok: true })
    } catch (e) {
      failed += 1
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[cron/bank-sync] falhou para ${conn.id}:`, e)
      results.push({ id: conn.id, ok: false, error: msg })
    }
  }

  return NextResponse.json({ total: connections.length, synced, failed, results })
}
