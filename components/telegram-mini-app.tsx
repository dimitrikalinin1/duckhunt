"use client"

import { useEffect, useState } from "react"

// Minimal Telegram WebApp typings
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        colorScheme: "light" | "dark"
        themeParams?: Record<string, string>
        initData?: string
        ready: () => void
        expand: () => void
        MainButton: { show: () => void; hide: () => void; setText: (t: string) => void }
        BackButton: { show: () => void; hide: () => void; onClick: (cb: () => void) => void }
        close: () => void
      }
    }
  }
}

export default function TelegramMiniApp() {
  const [ready, setReady] = useState(false)
  const [ok, setOk] = useState<boolean | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<null | { ok: boolean; error?: string }>(null)

  // Ensure WebApp API is initialized
  useEffect(() => {
    const wa = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined
    try {
      wa?.ready()
      wa?.expand()
      setReady(true)
    } catch {
      setReady(true)
    }
  }, [])

  // Validate initData on the server for trust
  useEffect(() => {
    const wa = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined
    const initData = wa?.initData
    if (!ready) return
    if (!initData) {
      setOk(false)
      return
    }
    ;(async () => {
      try {
        const r = await fetch("/api/telegram/auth", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ initData }),
        })
        setOk(r.ok)
      } catch {
        setOk(false)
      }
    })()
  }, [ready])

  // Read theme after we are on the client
  useEffect(() => {
    const scheme = typeof window !== "undefined" ? window.Telegram?.WebApp?.colorScheme : undefined
    setIsDark(scheme === "dark")
  }, [ready])

  async function sendMeMessage() {
    try {
      setSending(true)
      setSent(null)
      const wa = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined
      const initData = wa?.initData
      if (!initData) {
        setSent({ ok: false, error: "initData is missing (откройте /tg из Telegram)" })
        return
      }
      const r = await fetch("/api/telegram/ping", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData, text: "Привет из Mini App 👋" }),
      })
      const j = await r.json()
      if (!r.ok || !j.ok) {
        setSent({ ok: false, error: j.error || "sendMessage failed" })
      } else {
        setSent({ ok: true })
      }
    } catch (e: any) {
      setSent({ ok: false, error: e?.message || "error" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="min-h-dvh w-full"
      style={{
        background: isDark ? "black" : "white",
        color: isDark ? "white" : "black",
      }}
    >
      <div className="p-3 text-sm flex items-center justify-between">
        <span>Hunter vs Duck • Mini App</span>
        <span className="opacity-70">{ok === null ? "..." : ok ? "auth OK" : "unauthorized"}</span>
      </div>

      <div className="h-[calc(100dvh-40px)]">
        <iframe
          title="Game"
          src="/"
          className="w-full h-full border-0"
          allow="fullscreen; autoplay"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      <div className="p-3 flex items-center justify-center gap-8">
        <button
          onClick={sendMeMessage}
          disabled={sending || ok === false}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            background: isDark ? "rgb(30,30,30)" : "rgb(245,245,245)",
            opacity: sending ? 0.7 : 1,
            cursor: sending ? "not-allowed" : "pointer",
          }}
          title={ok ? "Отправит сообщение вам в Telegram" : "Mini App не авторизован (откройте через Telegram)"}
        >
          {sending ? "Отправка..." : "Отправить себе сообщение"}
        </button>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {sent == null ? "" : sent.ok ? "Отправлено ✅" : `Ошибка: ${sent.error || "—"}`}
        </span>
      </div>

      <div className="p-3 text-center">
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "8px 12px",
            borderRadius: 10,
            background: isDark ? "rgb(30,30,30)" : "rgb(245,245,245)",
          }}
        >
          Открыть игру полноэкранно
        </a>
      </div>
    </div>
  )
}
