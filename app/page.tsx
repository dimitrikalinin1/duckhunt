"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import SceneBackground from "@/components/scene-background"
import AppHeader from "@/components/app-header"
import CharacterSelect from "@/components/character-select"
import GameSession from "@/components/game-session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, User } from "lucide-react"
import type { PlayerCharacter } from "@/lib/ai-opponent"

export default function Page() {
  const [selectedCharacter, setSelectedCharacter] = useState<PlayerCharacter | null>(null)
  const [gameMode, setGameMode] = useState<"single" | "multi" | null>(null)
  const router = useRouter()

  const handleBackToMenu = () => {
    setSelectedCharacter(null)
    setGameMode(null)
  }

  const handleMultiplayer = () => {
    router.push("/multiplayer")
  }

  if (gameMode === "single" && selectedCharacter) {
    return (
      <SceneBackground>
        <AppHeader />
        <GameSession playerCharacter={selectedCharacter} onBackToMenu={handleBackToMenu} isMultiplayer={false} />
      </SceneBackground>
    )
  }

  if (gameMode === "single") {
    return (
      <SceneBackground>
        <AppHeader />
        <CharacterSelect onSelect={setSelectedCharacter} />
      </SceneBackground>
    )
  }

  return (
    <SceneBackground>
      <AppHeader />
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Охотник vs Утка</h1>
            <p className="text-xl text-muted-foreground">Выберите режим игры</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Одиночная игра</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Играйте против умного ИИ-противника. Выберите роль охотника или утки и проверьте свои навыки!
                </p>
                <Button onClick={() => setGameMode("single")} className="w-full" size="lg">
                  Играть с ИИ
                </Button>
              </CardContent>
            </Card>

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
