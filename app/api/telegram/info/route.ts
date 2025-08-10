import { type NextRequest, NextResponse } from "next/server"

function getApiBase() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set")
  return `https://api.telegram.org/bot${token}`
}

// GET /api/telegram/info -> proxies Telegram getWebhookInfo
export async function GET(_req: NextRequest) {
  try {
    const res = await fetch(`${getApiBase()}/getWebhookInfo`, { method: "GET", cache: "no-store" })
    const json = await res.json()
    return NextResponse.json({ ok: true, result: json })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 })
  }
}
