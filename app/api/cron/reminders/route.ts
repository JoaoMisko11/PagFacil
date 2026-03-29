import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Verifica o secret para proteger o endpoint
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
  const now = new Date()
  const tomorrow = new Date(now.toISOString().split("T")[0] + "T00:00:00Z")
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date(tomorrow.getTime() + 86400000)

  // Busca contas pendentes que vencem amanhã
  const bills = await db.bill.findMany({
    where: {
      status: "PENDING",
      deletedAt: null,
      dueDate: {
        gte: tomorrow,
        lt: dayAfter,
      },
    },
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
  })

  if (bills.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Agrupa por usuário
  const billsByUser = new Map<string, { email: string; name: string | null; bills: typeof bills }>()

  for (const bill of bills) {
    const existing = billsByUser.get(bill.userId)
    if (existing) {
      existing.bills.push(bill)
    } else {
      billsByUser.set(bill.userId, {
        email: bill.user.email,
        name: bill.user.name,
        bills: [bill],
      })
    }
  }

  let sent = 0

  for (const [, userData] of billsByUser) {
    const billLines = userData.bills
      .map(
        (b) =>
          `• ${b.supplier} — R$ ${(b.amount / 100).toFixed(2).replace(".", ",")}`
      )
      .join("\n")

    const count = userData.bills.length
    const subject =
      count === 1
        ? `Amanhã vence: ${userData.bills[0].supplier}`
        : `Amanhã vencem ${count} contas`

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
        to: userData.email,
        subject,
        text: `Olá${userData.name ? `, ${userData.name}` : ""}!\n\nVocê tem ${count} conta${count > 1 ? "s" : ""} vencendo amanhã:\n\n${billLines}\n\nAcesse o PagaFácil para marcar como paga:\n${process.env.NEXTAUTH_URL ?? "https://paga-facil.vercel.app"}\n\n— PagaFácil`,
      })
      sent++
    } catch (err) {
      console.error(`Erro ao enviar email para ${userData.email}:`, err)
    }
  }

  return NextResponse.json({ sent, totalBills: bills.length })
  } catch (error) {
    console.error("Erro no cron de reminders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
