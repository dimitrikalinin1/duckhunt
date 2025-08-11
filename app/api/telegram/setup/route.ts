import { NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function POST() {
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 400 })
  }

  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/api/telegram/webhook`

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
      }),
    })

    const result = await response.json()

    if (result.ok) {
      return NextResponse.json({ success: true, webhook_url: webhookUrl })
    } else {
      return NextResponse.json({ error: result.description }, { status: 400 })
    }
  } catch (error) {
    console.error("Telegram setup error:", error)
    return NextResponse.json({ error: "Setup failed" }, { status: 500 })
  }
}
