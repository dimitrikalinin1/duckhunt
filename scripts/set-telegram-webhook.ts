// Usage:
//   node scripts/set-telegram-webhook.ts https://your-domain.xyz/api/telegram/webhook
//
// Requires env:
//   TELEGRAM_BOT_TOKEN (BotFather token)
//   TELEGRAM_WEBHOOK_SECRET (any random string, optional but recommended)
//
// This script sets the webhook with a secret token so you can verify the sender.

async function main() {
  const urlArg = process.argv[2]
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error("Error: TELEGRAM_BOT_TOKEN is not set.")
    process.exit(1)
  }
  if (!urlArg) {
    console.error("Usage: node scripts/set-telegram-webhook.ts https://your-domain/api/telegram/webhook")
    process.exit(1)
  }
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || ""
  const api = `https://api.telegram.org/bot${token}/setWebhook`

  const body: any = { url: urlArg }
  if (secret) body.secret_token = secret

  const res = await fetch(api, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  console.log("setWebhook result:", json)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
