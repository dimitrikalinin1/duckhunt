import { type NextRequest, NextResponse } from "next/server"
import { getPublicBaseUrlFromRequest, tgSendMessage } from "@/lib/telegram"

export async function GET() {
  // Health check
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token")
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET || ""
  // If a secret is configured, enforce it. If not, allow to proceed (fallback).
  if (expectedSecret && secretHeader !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  const body = await req.json().catch(() => null as any)
  if (!body) return NextResponse.json({ ok: false }, { status: 400 })

  try {
    // Handle simple messages
    const message = body.message || body.edited_message || null
    if (message?.chat?.id) {
      const chatId = message.chat.id as number
      const text: string | undefined = message.text

      const origin = getPublicBaseUrlFromRequest(req)
      const webAppUrl = `${origin}/tg`

      if (text?.startsWith("/start")) {
        await tgSendMessage(chatId, "Добро пожаловать в Hunter vs Duck! Откройте мини‑приложение:", {
          reply_markup: {
            inline_keyboard: [[{ text: "Открыть Mini App", web_app: { url: webAppUrl } }]],
          },
        })
      } else if (text?.startsWith("/help")) {
        await tgSendMessage(
          chatId,
          "Команды:\n/start — приветствие и кнопка Mini App\n/help — помощь\n\nОткройте Mini App и играйте прямо в Telegram.",
          {
            reply_markup: {
              inline_keyboard: [[{ text: "Открыть Mini App", web_app: { url: webAppUrl } }]],
            },
          },
        )
      } else {
        await tgSendMessage(chatId, "Откройте Mini App, чтобы играть:", {
          reply_markup: {
            inline_keyboard: [[{ text: "Открыть Mini App", web_app: { url: webAppUrl } }]],
          },
        })
      }
    }

    // Handle callback_query if needed later
    return NextResponse.json({ ok: true })
  } catch (e) {
    // Swallow errors to keep Telegram happy
    return NextResponse.json({ ok: true })
  }
}
