"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import SceneBackground from "@/components/scene-background"
import CharacterSelect from "@/components/character-select"
import GameSession from "@/components/game-session"
import PlayerProfile from "@/components/player-profile"
import Inventory from "@/components/inventory"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Package } from "lucide-react"
import { useTelegramUser } from "@/hooks/use-telegram-user"
import type { PlayerCharacter } from "@/lib/ai-opponent"

export default function Page() {
  const [selectedCharacter, setSelectedCharacter] = useState<PlayerCharacter | null>(null)
  const [gameMode, setGameMode] = useState<"single" | "multi" | null>(null)
  const [showInventory, setShowInventory] = useState(false)
  const router = useRouter()
  const { user: telegramUser, isLoading } = useTelegramUser()

  const handleBackToMenu = () => {
    setSelectedCharacter(null)
    setGameMode(null)
  }

  const handleMultiplayer = () => {
    router.push("/multiplayer")
  }

  if (isLoading) {
    return (
      <SceneBackground>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex justify-center">
              <Card className="w-full max-w-md mx-auto">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SceneBackground>
    )
  }

  if (gameMode === "single" && selectedCharacter) {
    return (
      <SceneBackground>
        <GameSession playerCharacter={selectedCharacter} onBackToMenu={handleBackToMenu} isMultiplayer={false} />
      </SceneBackground>
    )
  }

  if (gameMode === "single") {
    return (
      <SceneBackground>
        <CharacterSelect onSelect={setSelectedCharacter} />
      </SceneBackground>
    )
  }

  return (
    <SceneBackground>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex justify-center">
            <PlayerProfile />
          </div>

          <div className="flex justify-center">
            <Dialog open={showInventory} onOpenChange={setShowInventory}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="flex items-center gap-2 bg-transparent">
                  <Package className="h-5 w-5" />
                  Инвентарь
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Мой инвентарь</DialogTitle>
                </DialogHeader>
                <Inventory playerId={telegramUser?.id.toString() || ""} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Существующая карточка многопользовательской игры */}
          <div className="grid justify-center">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-green-100 dark:bg-green-900 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Многопользовательская игра</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Создайте лобби или присоединитесь к игре с другими игроками. Настоящие противники ждут вас!
                </p>
                <Button onClick={handleMultiplayer} className="w-full" size="lg" variant="secondary">
                  Найти игроков
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SceneBackground>
  )
}
