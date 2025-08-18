"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Star, Zap, Target } from "lucide-react"
import { usePlayer } from "@/contexts/player-context"
import { GameIcons } from "@/components/game-icons"

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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Загрузка игры...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-6 py-8">
            <div className="relative">
              <h1 className="text-6xl md:text-7xl font-black text-foreground tracking-tight">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  DUCK HUNT
                </span>
              </h1>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-20 blur-xl -z-10"></div>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Тактическая охота в реальном времени
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span>Стратегия</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-secondary" />
                <span>Реальное время</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                <span>Мультиплеер</span>
              </div>
            </div>
          </div>

          {player && (
            <div className="game-panel max-w-md mx-auto">
              <div className="text-center space-y-6">
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <h2 className="text-3xl font-bold text-foreground">{player.username}</h2>
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary opacity-20 blur rounded-lg -z-10"></div>
                  </div>
                  <p className="text-muted-foreground font-mono text-sm">ID: {player.telegram_id}</p>
                </div>

                <div className="flex items-center justify-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="w-8 h-8">
                    <GameIcons.Coins />
                  </div>
                  <span className="text-2xl font-bold text-primary">{player.coins}</span>
                  <span className="text-sm text-muted-foreground">монет</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                    <div className="text-xs text-muted-foreground mb-1">Охотник</div>
                    <div className="text-lg font-bold text-secondary">Ур. {player.hunter_level}</div>
                  </div>
                  <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <div className="text-xs text-muted-foreground mb-1">Утка</div>
                    <div className="text-lg font-bold text-accent">Ур. {player.duck_level}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <div className="game-panel w-full max-w-md hover:scale-105 transition-all duration-300">
              <div className="text-center space-y-6">
                <div className="mx-auto p-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/30 animate-glow-pulse">
                  <div className="w-12 h-12">
                    <GameIcons.Play />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">Начать игру</h3>
                  <p className="text-muted-foreground">Выберите роль и начните охоту</p>
                </div>
                <Button
                  onClick={handlePlay}
                  className="w-full game-button text-xl py-8 font-black tracking-wide"
                  size="lg"
                >
                  ИГРАТЬ
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="game-panel text-center hover:scale-105 transition-all duration-300">
              <div className="p-6 rounded-full bg-primary/10 border border-primary/20 w-fit mx-auto mb-4">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Рейтинг</h3>
              <p className="text-sm text-muted-foreground">Поднимайся в лидерборде и стань лучшим охотником</p>
            </div>

            <div className="game-panel text-center hover:scale-105 transition-all duration-300">
              <div className="p-6 rounded-full bg-secondary/10 border border-secondary/20 w-fit mx-auto mb-4">
                <Star className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Достижения</h3>
              <p className="text-sm text-muted-foreground">Открывай награды и получай уникальные перки</p>
            </div>

            <div className="game-panel text-center hover:scale-105 transition-all duration-300">
              <div className="p-6 rounded-full bg-accent/10 border border-accent/20 w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">Мультиплеер</h3>
              <p className="text-sm text-muted-foreground">Играй с друзьями в захватывающих матчах</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
