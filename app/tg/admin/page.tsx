"use client"

import { useState } from "react"

export default function TelegramAdminPage() {
  const [log, setLog] = useState<string>("")

  async function call(path: string) {
    setLog("...")
    try {
      const res = await fetch(path, { method: "GET", cache: "no-store" })
      const json = await res.json()
      setLog(JSON.stringify(json, null, 2))
    } catch (e: any) {
      setLog(`Error: ${e?.message || e}`)
    }
  }

  return (
    <main className="container mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Telegram Integration Admin</h1>
      <p className="text-sm text-muted-foreground">
        Нажмите «Установить webhook», чтобы привязать бота к {" /api/telegram/webhook "} на текущем домене.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-md border px-3 py-2 hover:bg-accent"
          onClick={() => call("/api/telegram/setup")}
          title="setWebhook"
        >
          Установить webhook
        </button>
        <button
          className="rounded-md border px-3 py-2 hover:bg-accent"
          onClick={() => call("/api/telegram/setup?drop=1")}
          title="deleteWebhook"
        >
          Удалить webhook
        </button>
        <button
          className="rounded-md border px-3 py-2 hover:bg-accent"
          onClick={() => call("/api/telegram/info")}
          title="getWebhookInfo"
        >
          Статус webhook
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-xs bg-muted p-3 rounded-md">{log || "Готово."}</pre>
      <div className="text-sm text-muted-foreground space-y-1">
        <div>Подсказка: успешный ответ содержит result.result.url с адресом вебхука.</div>
        <div>Полезные поля: url, pending_update_count, last_error_message, ip_address, max_connections.</div>
      </div>
    </main>
  )
}
