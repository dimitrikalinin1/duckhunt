import { NextResponse } from "next/server"
import { tgSendMessage } from "@/lib/telegram"
import { verifyInitData } from "@/lib/telegram"

// POST /api/telegram/ping
// body: { initData: string, text?: string }
export async function POST(req: Request) {
  try {
    const { initData, text } = await req.json()
    if (!initData || typeof initData !== "string") {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 })
    }
    const verified = verifyInitData(initData)
    if (!verified?.user?.id) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }

    // В приватном чате chat_id == user.id (при условии, что пользователь нажал Start у бота)
    const chatId = verified.user.id as number
    const msg = text || "Mini App ping: связь с ботом без вебхука работает ✅"

    const result = await tgSendMessage(chatId, msg, { parse_mode: "HTML" })
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    // Если пользователь НЕ нажал Start у бота — Telegram вернёт 403 (бот не может начать чат)
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 })
  }
}
