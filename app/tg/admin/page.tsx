"use client"

import { useState } from "react"

export default function TelegramAdminPage() {
  const [log, setLog] = useState<string>("")

  async function call(path: string) {
    setLog("...")
    try {
      const res = await fetch(path, { method: "GET" })
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
        Нажмите "Установить webhook", чтобы привязать бота к {"/api/telegram/webhook"} на текущем домене.
      </p>
      <div className="flex gap-2">
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
      </div>
      <pre className="whitespace-pre-wrap text-xs bg-muted p-3 rounded-md">{log || "Готово."}</pre>
      <div className="text-sm text-muted-foreground">
        Подсказка: если переменная окружения TELEGRAM_WEBHOOK_SECRET не задана — вебхук создаётся без секрета, а
        обработчик пропускает запросы без проверки. Рекомендуется задать секрет позже для лучшей безопасности.
      </div>
    </main>
  )
}
