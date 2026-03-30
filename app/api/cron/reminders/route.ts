import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import nodemailer from "nodemailer"
import { sendTelegramMessage } from "@/lib/telegram"

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

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
        select: { email: true, name: true, telegramChatId: true, notifyVia: true },
      },
    },
  })

  if (bills.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Agrupa por usuário
  const billsByUser = new Map<
    string,
    { email: string; name: string | null; telegramChatId: string | null; notifyVia: string; bills: typeof bills }
  >()

  for (const bill of bills) {
    const existing = billsByUser.get(bill.userId)
    if (existing) {
      existing.bills.push(bill)
    } else {
      billsByUser.set(bill.userId, {
        email: bill.user.email,
        name: bill.user.name,
        telegramChatId: bill.user.telegramChatId,
        notifyVia: bill.user.notifyVia,
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
    const greeting = `Olá${userData.name ? `, ${userData.name}` : ""}!`

    if (userData.notifyVia === "telegram" && userData.telegramChatId) {
      // Envia via Telegram
      try {
        await sendTelegramMessage(
          userData.telegramChatId,
          `${greeting}\n\nVocê tem ${count} conta${count > 1 ? "s" : ""} vencendo amanhã:\n\n${billLines}\n\nAcesse o PagaFácil para marcar como paga.`
        )
        sent++
      } catch (err) {
        console.error(`Erro ao enviar Telegram para ${userData.telegramChatId}:`, err)
      }
    } else {
      // Envia via email
      const subject =
        count === 1
          ? `Amanhã vence: ${userData.bills[0].supplier}`
          : `Amanhã vencem ${count} contas`

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
          to: userData.email,
          subject,
          text: `${greeting}\n\nVocê tem ${count} conta${count > 1 ? "s" : ""} vencendo amanhã:\n\n${billLines}\n\nAcesse o PagaFácil para marcar como paga:\n${process.env.NEXTAUTH_URL ?? "https://paga-facil.vercel.app"}\n\n— PagaFácil`,
        })
        sent++
      } catch (err) {
        console.error(`Erro ao enviar email para ${userData.email}:`, err)
      }
    }
  }

  return NextResponse.json({ sent, totalBills: bills.length })
  } catch (error) {
    console.error("Erro no cron de reminders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
