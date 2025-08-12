"use client"

import { useEffect, useState } from "react"

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    auth_date: number
    hash: string
  }
  ready: () => void
  expand: () => void
  close: () => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export function useTelegramUser() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)

  useEffect(() => {
    const initTelegram = () => {
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        setWebApp(tg)

        // Инициализируем Telegram Web App
        tg.ready()
        tg.expand()

        // Получаем данные пользователя
        if (tg.initDataUnsafe?.user) {
          setUser(tg.initDataUnsafe.user)
        } else {
          // Для разработки - создаем тестового пользователя
          if (process.env.NODE_ENV === "development") {
            setUser({
              id: 123456789,
              first_name: "Test",
              last_name: "User",
              username: "testuser",
              language_code: "ru",
            })
          }
        }

        setIsLoading(false)
      } else {
        // Повторяем попытку через 100мс если скрипт еще не загружен
        setTimeout(initTelegram, 100)
      }
    }

    initTelegram()
  }, [])

  return { user, isLoading, webApp }
}
