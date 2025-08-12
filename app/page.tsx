"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PlayerProfile from "@/components/player-profile"
import Inventory from "@/components/inventory"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Package, TreePine, Mountain } from "lucide-react"
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
      <div className="min-h-screen bg-gradient-to-b from-sky-300 via-green-200 to-green-400 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-center items-center min-h-screen">
            <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm">
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
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-green-200 to-green-400 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <TreePine className="absolute top-20 left-10 h-12 w-12 text-green-700/30 transform rotate-12" />
        <TreePine className="absolute top-32 right-16 h-8 w-8 text-green-600/40 transform -rotate-6" />
        <Mountain className="absolute bottom-20 left-20 h-16 w-16 text-gray-600/20" />
        <div className="absolute top-16 right-32 w-8 h-8 bg-yellow-300/60 rounded-full"></div>
        <div className="absolute top-40 left-1/3 w-4 h-4 bg-white/70 rounded-full"></div>
        <div className="absolute bottom-32 right-1/4 w-6 h-6 bg-blue-200/50 rounded-full"></div>
      </div>

      <div className="container mx-auto p-4 md:p-6 lg:p-8 relative z-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-1">
              <PlayerProfile />
            </div>
          </div>

          <div className="flex justify-center">
            <Dialog open={showInventory} onOpenChange={setShowInventory}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 bg-amber-100/80 hover:bg-amber-200/80 border-amber-300 text-amber-800 backdrop-blur-sm"
                >
                  <Package className="h-5 w-5" />
                  Мой инвентарь
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
                <DialogHeader>
                  <DialogTitle>Мой инвентарь</DialogTitle>
                </DialogHeader>
                <Inventory playerId={telegramUser?.id.toString() || ""} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex justify-center">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white/90 backdrop-blur-sm border-2 border-green-300 max-w-md w-full">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 group-hover:from-green-500 group-hover:to-emerald-600 transition-all duration-300 shadow-lg">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-green-800">Играть онлайн</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4 pt-0">
                <p className="text-green-700 text-lg">Найди соперника и покажи свои навыки!</p>
                <Button
                  onClick={handleMultiplayer}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 text-lg shadow-lg"
                  size="lg"
                >
                  Начать игру
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
