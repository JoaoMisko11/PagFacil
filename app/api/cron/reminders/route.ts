import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import nodemailer from "nodemailer"
import webpush from "web-push"
import { sendTelegramMessage, escapeHtml } from "@/lib/telegram"

webpush.setVapidDetails(
  "mailto:" + (process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? "noreply@pagafacil.app"),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function GET(request: Request) {
  // Verifica o secret + header Vercel para proteger o endpoint
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}` || (process.env.VERCEL && !isVercelCron)) {
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
        select: {
          email: true,
          name: true,
          telegramChatId: true,
          notifyVia: true,
          pushSubscriptions: { select: { endpoint: true, p256dh: true, auth: true } },
        },
      },
    },
  })

  if (bills.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Agrupa por usuário
  const billsByUser = new Map<
    string,
    {
      email: string
      name: string | null
      telegramChatId: string | null
      notifyVia: string
      pushSubscriptions: { endpoint: string; p256dh: string; auth: string }[]
      bills: typeof bills
    }
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
        pushSubscriptions: bill.user.pushSubscriptions,
        bills: [bill],
      })
    }
  }

  let sent = 0

  for (const [, userData] of billsByUser) {
    const count = userData.bills.length
    const safeName = userData.name ? escapeHtml(userData.name) : null

    const channels = userData.notifyVia.split(",")

    if (channels.includes("telegram") && userData.telegramChatId) {
      const tgBillLines = userData.bills
        .map(
          (b) =>
            `• ${escapeHtml(b.supplier)} — R$ ${(b.amount / 100).toFixed(2).replace(".", ",")}`
        )
        .join("\n")
      const tgGreeting = `Olá${safeName ? `, ${safeName}` : ""}!`

      try {
        await sendTelegramMessage(
          userData.telegramChatId,
          `${tgGreeting}\n\nVocê tem ${count} conta${count > 1 ? "s" : ""} vencendo amanhã:\n\n${tgBillLines}\n\nAcesse o PagaFácil para marcar como paga.`
        )
        sent++
      } catch (err) {
        console.error(`Erro ao enviar Telegram para ${userData.telegramChatId}:`, err)
      }
    }

    if (channels.includes("email")) {
      const emailBillLines = userData.bills
        .map(
          (b) =>
            `• ${b.supplier} — R$ ${(b.amount / 100).toFixed(2).replace(".", ",")}`
        )
        .join("\n")
      const emailGreeting = `Olá${userData.name ? `, ${userData.name}` : ""}!`
      const subject =
        count === 1
          ? `Amanhã vence: ${userData.bills[0].supplier}`
          : `Amanhã vencem ${count} contas`

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
          to: userData.email,
          subject,
          text: `${emailGreeting}\n\nVocê tem ${count} conta${count > 1 ? "s" : ""} vencendo amanhã:\n\n${emailBillLines}\n\nAcesse o PagaFácil para marcar como paga:\n${process.env.NEXTAUTH_URL ?? "https://paga-facil.vercel.app"}\n\n— PagaFácil`,
        })
        sent++
      } catch (err) {
        console.error(`Erro ao enviar email para ${userData.email}:`, err)
      }
    }

    if (channels.includes("push") && userData.pushSubscriptions.length > 0) {
      const pushBillLines = userData.bills
        .map(
          (b) =>
            `${b.supplier} — R$ ${(b.amount / 100).toFixed(2).replace(".", ",")}`
        )
        .join(", ")
      const pushBody =
        count === 1
          ? `Amanhã vence: ${pushBillLines}`
          : `${count} contas vencem amanhã: ${pushBillLines}`
      const payload = JSON.stringify({
        title: "PagaFácil - Lembrete",
        body: pushBody,
        tag: "pagafacil-reminder",
        url: "/dashboard",
      })

      for (const sub of userData.pushSubscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          )
          sent++
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number }).statusCode
          if (statusCode === 410 || statusCode === 404) {
            // Subscription expirou, remove do banco
            await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {})
          }
          console.error(`Erro ao enviar push para ${sub.endpoint.slice(0, 50)}...:`, err)
        }
      }
    }
  }

  return NextResponse.json({ sent, totalBills: bills.length })
  } catch (error) {
    console.error("Erro no cron de reminders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
