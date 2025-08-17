"use client"
import { User, Target, Bird, Coins, Star } from "lucide-react"
import { usePlayer } from "@/contexts/player-context"

export default function PlayerProfile() {
  const { player, loading } = usePlayer()

  if (loading) {
    return (
      <div className="card-game w-full max-w-md mx-auto animate-pulse">
        <div className="p-8 space-y-4">
          <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-3/4"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="card-game w-full max-w-md mx-auto">
        <div className="p-8 text-center">
          <p className="text-gray-600 font-medium">Не удалось загрузить профиль игрока</p>
        </div>
      </div>
    )
  }

  const hunterExpToNext = 100 - (player.hunter_experience % 100)
  const duckExpToNext = 100 - (player.duck_experience % 100)
  const hunterProgress = player.hunter_experience % 100
  const duckProgress = player.duck_experience % 100

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="card-game p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800">{player.username}</h2>
              <div className="text-sm text-gray-500 font-mono">ID: {player.telegram_id}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-2 rounded-full font-bold text-sm">
              <Coins className="h-4 w-4" />
              {player.coins}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Охотник */}
        <div className="card-game p-5 hover:scale-105 transition-all duration-300">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto animate-pulse-glow">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-black text-gray-800 text-lg">ОХОТНИК</h3>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="h-4 w-4 text-orange-500" />
                <span className="font-bold text-orange-600">LVL {player.hunter_level}</span>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-500 progress-game"
                    style={{ width: `${hunterProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 font-medium">{hunterProgress}/100 XP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Утка */}
        <div className="card-game p-5 hover:scale-105 transition-all duration-300">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto animate-pulse-glow">
              <Bird className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-black text-gray-800 text-lg">УТКА</h3>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="h-4 w-4 text-cyan-500" />
                <span className="font-bold text-cyan-600">LVL {player.duck_level}</span>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500 progress-game"
                    style={{ width: `${duckProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 font-medium">{duckProgress}/100 XP</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
