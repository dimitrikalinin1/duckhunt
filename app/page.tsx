"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PlayerProfile from "@/components/player-profile"
import Inventory from "@/components/inventory"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Package, Zap, Star, Trophy, Gamepad2 } from "lucide-react"
import { useTelegramUser } from "@/hooks/use-telegram-user"

export default function Page() {
  const [showInventory, setShowInventory] = useState(false)
  const router = useRouter()
  const { user: telegramUser, isLoading } = useTelegramUser()

  const handleMultiplayer = () => {
    router.push("/multiplayer")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 bg-game-pattern">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-center items-center min-h-screen">
            <div className="card-game w-full max-w-md mx-auto animate-pulse">
              <div className="p-8 space-y-4">
                <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-3/4"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden bg-game-pattern">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full opacity-20 animate-float"></div>
        <div
          className="absolute top-32 right-16 w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-30 animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-20 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-15 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <Star className="absolute top-16 right-32 h-8 w-8 text-yellow-400/40 animate-pulse" />
        <Zap
          className="absolute top-40 left-1/3 h-6 w-6 text-cyan-400/50 animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
        <Trophy
          className="absolute bottom-32 right-1/4 h-10 w-10 text-orange-400/30 animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="container mx-auto p-4 md:p-6 lg:p-8 relative z-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="text-center animate-slide-in">
            <h1 className="text-6xl md:text-7xl font-black text-game-title mb-4">DUCK HUNT</h1>
            <p className="text-xl text-gray-300 font-medium">Тактическая охота в реальном времени</p>
          </div>

          <div className="flex justify-center animate-bounce-in" style={{ animationDelay: "0.2s" }}>
            <div className="card-game p-2">
              <PlayerProfile />
            </div>
          </div>

          <div className="flex justify-center animate-bounce-in" style={{ animationDelay: "0.4s" }}>
            <Dialog open={showInventory} onOpenChange={setShowInventory}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="btn-game-primary text-white font-bold text-lg px-8 py-4 flex items-center gap-3 animate-pulse-glow"
                >
                  <Package className="h-6 w-6" />
                  МОЙ ИНВЕНТАРЬ
                </Button>
              </DialogTrigger>
              <DialogContent className="card-game max-w-md border-0">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-game-title">Мой инвентарь</DialogTitle>
                </DialogHeader>
                <Inventory playerId={telegramUser?.id.toString() || ""} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex justify-center animate-bounce-in" style={{ animationDelay: "0.6s" }}>
            <Card className="card-game hover:scale-105 transition-all duration-500 cursor-pointer group max-w-md w-full border-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="text-center pb-6 relative z-10">
                <div className="mx-auto mb-6 p-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 group-hover:from-orange-400 group-hover:to-red-500 transition-all duration-500 shadow-2xl animate-pulse-glow">
                  <Gamepad2 className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-black text-game-title mb-2">ИГРАТЬ ОНЛАЙН</CardTitle>
                <p className="text-gray-600 text-lg font-medium">Найди достойного соперника!</p>
              </CardHeader>
              <CardContent className="text-center space-y-6 pt-0 relative z-10">
                <div className="flex justify-center space-x-4 text-sm font-bold text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>1 VS 1</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    <span>БЫСТРАЯ ИГРА</span>
                  </div>
                </div>
                <Button
                  onClick={handleMultiplayer}
                  className="w-full btn-game-primary text-white font-black text-xl py-6 text-shadow-lg"
                  size="lg"
                >
                  НАЧАТЬ БИТВУ
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-in" style={{ animationDelay: "0.8s" }}>
            <div className="card-game p-6 text-center">
              <Trophy className="h-8 w-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">РЕЙТИНГОВЫЕ ИГРЫ</h3>
              <p className="text-sm text-gray-600">Поднимайся в лидерборде</p>
            </div>
            <div className="card-game p-6 text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">ДОСТИЖЕНИЯ</h3>
              <p className="text-sm text-gray-600">Открывай новые награды</p>
            </div>
            <div className="card-game p-6 text-center">
              <Zap className="h-8 w-8 text-cyan-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">ТУРНИРЫ</h3>
              <p className="text-sm text-gray-600">Участвуй в соревнованиях</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
