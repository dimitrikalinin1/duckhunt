"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Gamepad2, Users, Trophy, Star } from "lucide-react"
import { usePlayer } from "@/contexts/player-context"

export default function Page() {
  const router = useRouter()
  const { player, loading } = usePlayer()

  const handlePlay = () => {
    router.push("/role-select")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">Duck Hunt</h1>
            <p className="text-xl text-muted-foreground">Тактическая охота в реальном времени</p>
          </div>

          {player && (
            <Card className="minimal-card">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">{player.username}</h2>
                    <p className="text-muted-foreground">ID: {player.telegram_id}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-2xl">🪙</div>
                    <span className="text-xl font-semibold">{player.coins}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Общий уровень: {Math.max(player.hunter_level, player.duck_level)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Card className="minimal-card w-full max-w-md hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-6 rounded-full bg-primary/10">
                  <Gamepad2 className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Начать игру</CardTitle>
                <p className="text-muted-foreground">Выберите роль и начните охоту</p>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={handlePlay} className="w-full minimal-button text-lg py-6" size="lg">
                  Играть
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="minimal-card text-center p-4">
              <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm mb-1">Рейтинг</h3>
              <p className="text-xs text-muted-foreground">Поднимайся в лидерборде</p>
            </Card>
            <Card className="minimal-card text-center p-4">
              <Star className="h-6 w-6 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm mb-1">Достижения</h3>
              <p className="text-xs text-muted-foreground">Открывай награды</p>
            </Card>
            <Card className="minimal-card text-center p-4">
              <Users className="h-6 w-6 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm mb-1">Мультиплеер</h3>
              <p className="text-xs text-muted-foreground">Играй с друзьями</p>
            </Card>
          </div>

          {player && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Добро пожаловать, <span className="font-medium">{player.username}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
