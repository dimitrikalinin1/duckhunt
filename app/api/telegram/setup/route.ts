import { type NextRequest, NextResponse } from "next/server"

function getApiBase() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set")
  return `https://api.telegram.org/bot${token}`
}

function getPublicBaseUrlFromRequest(req: NextRequest) {
  const proto = "https"
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").toString()
  return `${proto}://${host}`
}

// GET /api/telegram/setup
// Optional query params:
//   ?drop=1   -> delete webhook
export async function GET(req: NextRequest) {
  try {
    const apiBase = getApiBase()
    const url = new URL(req.url)
    const drop = url.searchParams.get("drop") === "1"

    if (drop) {
      const res = await fetch(`${apiBase}/deleteWebhook`, { method: "POST" })
      const json = await res.json()
      return NextResponse.json({ ok: true, action: "delete", result: json })
    }

    const origin = getPublicBaseUrlFromRequest(req)
    const webhookUrl = `${origin}/api/telegram/webhook`
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET || ""

    const body: any = { url: webhookUrl }
    if (secret) body.secret_token = secret

    const res = await fetch(`${apiBase}/setWebhook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    return NextResponse.json({
      ok: true,
      action: "set",
      webhookUrl,
      usingSecret: Boolean(secret),
      result: json,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "setup_failed" }, { status: 500 })
  }
}
