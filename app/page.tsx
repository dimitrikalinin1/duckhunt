"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground text-sm">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Duck Hunt</h1>
          <p className="text-muted-foreground text-sm">Тактическая игра для двоих</p>
        </div>

        {player && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-card-foreground">{player.username}</h2>
              <p className="text-xs text-muted-foreground font-mono">ID: {player.telegram_id}</p>
            </div>

            <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-md">
              <span className="text-lg font-bold text-primary">{player.coins}</span>
              <span className="text-xs text-muted-foreground">монет</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-muted rounded-md">
                <div className="text-xs text-muted-foreground">Охотник</div>
                <div className="text-sm font-semibold text-foreground">Ур. {player.hunter_level}</div>
              </div>
              <div className="text-center p-2 bg-muted rounded-md">
                <div className="text-xs text-muted-foreground">Утка</div>
                <div className="text-sm font-semibold text-foreground">Ур. {player.duck_level}</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={handlePlay} className="w-full h-12 text-base font-semibold" size="lg">
            Играть
          </Button>
          <p className="text-center text-xs text-muted-foreground">Выберите роль и начните игру</p>
        </div>
      </div>
    </div>
  )
}
