import { NextResponse } from "next/server"
import { sendTelegramMessage } from "@/lib/telegram"

export async function POST(request: Request) {
  const body = await request.json()
  const message = body?.message

  if (!message?.chat?.id) {
    return NextResponse.json({ ok: true })
  }

  const chatId = String(message.chat.id)
  const text = (message.text ?? "").trim()

  if (text === "/start" || text === "/meuid") {
    await sendTelegramMessage(
      chatId,
      `Olá! Seu Chat ID é:\n\n<b>${chatId}</b>\n\nCopie esse número e cole no PagaFácil para vincular sua conta ou fazer login.`
    )
  }

  return NextResponse.json({ ok: true })
}
