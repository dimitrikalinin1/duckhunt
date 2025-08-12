"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { User, Target, Bird, Coins } from "lucide-react"
import type { Player } from "@/lib/supabase/client"
import { getOrCreatePlayer } from "@/lib/player-service"
import { useTelegramUser } from "@/hooks/use-telegram-user"

export default function PlayerProfile() {
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const { user: telegramUser, isLoading: telegramLoading } = useTelegramUser()

  useEffect(() => {
    async function loadPlayer() {
      if (telegramLoading) return

      if (!telegramUser) {
        console.error("No Telegram user data available")
        setLoading(false)
        return
      }

      try {
        console.log("Loading player for Telegram user:", telegramUser)
        const playerData = await getOrCreatePlayer(
          telegramUser.id,
          telegramUser.username ||
            `${telegramUser.first_name}${telegramUser.last_name ? ` ${telegramUser.last_name}` : ""}`,
        )
        setPlayer(playerData)
      } catch (error) {
        console.error("Error loading player:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPlayer()
  }, [telegramUser, telegramLoading])

  if (loading || telegramLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!telegramUser) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Приложение должно быть запущено в Telegram</p>
        </CardContent>
      </Card>
    )
  }

  if (!player) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Не удалось загрузить профиль игрока</p>
        </CardContent>
      </Card>
    )
  }

  // Вычисляем прогресс до следующего уровня
  const hunterExpToNext = 100 - (player.hunter_experience % 100)
  const duckExpToNext = 100 - (player.duck_experience % 100)
  const hunterProgress = player.hunter_experience % 100
  const duckProgress = player.duck_experience % 100

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {player.username}
          {telegramUser.is_premium && (
            <Badge variant="default" className="bg-blue-500">
              Premium
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span className="font-medium">{player.coins} монет</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Охотник */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Охотник</span>
            </div>
            <Badge variant="secondary">Уровень {player.hunter_level}</Badge>
          </div>
          <Progress value={hunterProgress} className="h-2" />
          <p className="text-xs text-gray-500">
            {hunterProgress}/100 опыта (до следующего уровня: {hunterExpToNext})
          </p>
        </div>

        {/* Утка */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bird className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Утка</span>
            </div>
            <Badge variant="secondary">Уровень {player.duck_level}</Badge>
          </div>
          <Progress value={duckProgress} className="h-2" />
          <p className="text-xs text-gray-500">
            {duckProgress}/100 опыта (до следующего уровня: {duckExpToNext})
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
