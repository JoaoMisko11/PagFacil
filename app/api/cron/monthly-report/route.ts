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

function formatCurrency(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Mês anterior
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    const monthName = start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

    // Busca todos os usuários com contas
    const users = await db.user.findMany({
      where: {
        bills: { some: { deletedAt: null } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        telegramChatId: true,
        notifyVia: true,
      },
    })

    let sent = 0

    for (const user of users) {
      const [paidBills, pendingBills, overdueBills] = await Promise.all([
        db.bill.findMany({
          where: {
            userId: user.id,
            deletedAt: null,
            status: "PAID",
            paidAt: { gte: start, lte: end },
          },
          select: { amount: true, supplier: true },
        }),
        db.bill.findMany({
          where: {
            userId: user.id,
            deletedAt: null,
            status: "PENDING",
            dueDate: { gte: start, lte: end },
          },
          select: { amount: true },
        }),
        db.bill.count({
          where: {
            userId: user.id,
            deletedAt: null,
            status: "PENDING",
            dueDate: { lt: start },
          },
        }),
      ])

      // Pula se o usuário não teve atividade no mês
      if (paidBills.length === 0 && pendingBills.length === 0) continue

      const totalPaid = paidBills.reduce((sum, b) => sum + b.amount, 0)
      const totalPending = pendingBills.reduce((sum, b) => sum + b.amount, 0)
      const greeting = `Ola${user.name ? `, ${user.name}` : ""}!`

      const report = [
        `${greeting}`,
        ``,
        `Seu resumo de ${monthName}:`,
        ``,
        `Contas pagas: ${paidBills.length} (${formatCurrency(totalPaid)})`,
        `Contas pendentes: ${pendingBills.length} (${formatCurrency(totalPending)})`,
        overdueBills > 0 ? `Contas vencidas: ${overdueBills}` : `Atrasos: 0`,
        ``,
        paidBills.length > 0 && pendingBills.length === 0 && overdueBills === 0
          ? `Parabens! Todas as contas do mes foram pagas em dia.`
          : `Acesse o PagaFacil para conferir os detalhes.`,
      ].join("\n")

      const channels = (user.notifyVia ?? "email").split(",")

      if (channels.includes("telegram") && user.telegramChatId) {
        try {
          await sendTelegramMessage(user.telegramChatId, report)
          sent++
        } catch (err) {
          console.error(`Erro Telegram monthly report para ${user.telegramChatId}:`, err)
        }
      }

      if (channels.includes("email")) {
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
            to: user.email,
            subject: `Resumo ${monthName} — PagaFacil`,
            text: `${report}\n\n${process.env.NEXTAUTH_URL ?? "https://paga-facil.vercel.app"}\n\n— PagaFacil`,
          })
          sent++
        } catch (err) {
          console.error(`Erro email monthly report para ${user.email}:`, err)
        }
      }
    }

    return NextResponse.json({ sent, users: users.length })
  } catch (error) {
    console.error("Erro no cron monthly report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
