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
