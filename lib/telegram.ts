import crypto from "crypto"

export function getTelegramApiBase() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set")
  return `https://api.telegram.org/bot${token}`
}

export async function tgSendMessage(chatId: number | string, text: string, opts: Record<string, any> = {}) {
  const base = getTelegramApiBase()
  const res = await fetch(`${base}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, ...opts }),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new Error(`sendMessage failed: ${res.status} ${msg}`)
  }
  return res.json()
}

// Telegram WebApp initData verification
// Docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
export function verifyInitData(initData: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set")

  const params = new URLSearchParams(initData)
  const hash = params.get("hash") || ""

  // Construct data_check_string
  const pairs: string[] = []
  params.forEach((value, key) => {
    if (key === "hash") return
    pairs.push(`${key}=${value}`)
  })
  pairs.sort()
  const dataCheckString = pairs.join("\n")

  // secret_key = HMAC_SHA256("WebAppData", bot_token)
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(token).digest()
  const calcHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

  if (calcHash !== hash) return null

  // Parse user if present
  const rawUser = params.get("user")
  let user: any = null
  try {
    user = rawUser ? JSON.parse(rawUser) : null
  } catch {
    user = null
  }
  return {
    user,
    auth_date: Number(params.get("auth_date") || 0),
    query_id: params.get("query_id"),
  }
}

export function getPublicBaseUrlFromRequest(req: Request) {
  const proto = "https" // Vercel/Prod uses HTTPS for Telegram callbacks
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").toString()
  return `${proto}://${host}`
}
