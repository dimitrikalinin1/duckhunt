"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useTelegramUser } from "@/hooks/use-telegram-user"
import { getOrCreatePlayer } from "@/lib/player-service"
import type { Player } from "@/lib/supabase/client"

interface PlayerContextType {
  player: Player | null
  loading: boolean
  error: string | null
  refreshPlayer: () => Promise<void>
  updatePlayerData: (updates: Partial<Player>) => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user: telegramUser, isLoading: telegramLoading } = useTelegramUser()

  const refreshPlayer = async () => {
    if (telegramLoading || !telegramUser) return

    try {
      setError(null)
      const playerData = await getOrCreatePlayer(
        telegramUser.id,
        telegramUser.username ||
          `${telegramUser.first_name}${telegramUser.last_name ? ` ${telegramUser.last_name}` : ""}`,
      )
      setPlayer(playerData)
    } catch (err) {
      console.error("Error loading player:", err)
      setError("Не удалось загрузить данные игрока")
    } finally {
      setLoading(false)
    }
  }

  const updatePlayerData = (updates: Partial<Player>) => {
    if (player) {
      setPlayer({ ...player, ...updates })
    }
  }

  useEffect(() => {
    refreshPlayer()
  }, [telegramUser, telegramLoading])

  useEffect(() => {
    if (!player) return

    const interval = setInterval(refreshPlayer, 30000) // Обновляем каждые 30 секунд
    return () => clearInterval(interval)
  }, [player])

  return (
    <PlayerContext.Provider
      value={{
        player,
        loading: loading || telegramLoading,
        error,
        refreshPlayer,
        updatePlayerData,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider")
  }
  return context
}
