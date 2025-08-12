"use client"

import { useState } from "react"
import { Coins, TrendingUp, Shield } from "lucide-react"

type Props = {
  playerRole: "hunter" | "duck"
  currentBet: number
  playerGold: number
  opponentBet: number
  armoredFeatherRank?: number
  onBetChange: (newBet: number) => void
  disabled?: boolean
}

export default function BettingInterface({
  playerRole,
  currentBet,
  playerGold,
  opponentBet,
  armoredFeatherRank = 0,
  onBetChange,
  disabled = false,
}: Props) {
  const [tempBet, setTempBet] = useState(currentBet)

  const maxBet = Math.min(playerGold, 100)
  const minBet = 10

  const handleBetChange = (value: number) => {
    const newBet = Math.max(minBet, Math.min(maxBet, value))
    setTempBet(newBet)
    onBetChange(newBet)
  }

  const getProtectionInfo = () => {
    if (playerRole === "duck" && armoredFeatherRank > 0) {
      const protectionPercent = armoredFeatherRank === 1 ? 5 : armoredFeatherRank === 2 ? 10 : 15
      const savedAmount = Math.floor(tempBet * (protectionPercent / 100))
      return { protectionPercent, savedAmount }
    }
    return null
  }

  const protection = getProtectionInfo()

  return (
    <div className="game-card animate-slide-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
          <Coins className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">💰 Ставки</h3>
          <p className="text-slate-400">Установите размер ставки</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Текущий баланс */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
          <span className="text-slate-300">Ваш баланс:</span>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-400" />
            <span className="font-bold text-xl text-white">{playerGold}</span>
          </div>
        </div>

        {/* Управление ставкой */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Ваша ставка:</span>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-green-400" />
              <span className="font-bold text-xl text-green-400">{tempBet}</span>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="range"
              min={minBet}
              max={maxBet}
              value={tempBet}
              onChange={(e) => handleBetChange(Number.parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            />

            <div className="flex justify-between text-sm text-slate-400">
              <span>{minBet}</span>
              <span>{maxBet}</span>
            </div>

            <div className="flex gap-2">
              {[25, 50, 75, 100].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleBetChange(amount)}
                  disabled={disabled || amount > playerGold}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                    amount <= playerGold && !disabled
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ставка противника */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
          <span className="text-slate-300">Ставка противника:</span>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-red-400" />
            <span className="font-bold text-xl text-red-400">{opponentBet}</span>
          </div>
        </div>

        {/* Потенциальный выигрыш */}
        <div className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <span className="font-bold text-green-400">Потенциальный выигрыш:</span>
          </div>
          <div className="text-2xl font-bold text-green-400">+{opponentBet}</div>
        </div>

        {/* Защита бронированного пера */}
        {protection && (
          <div className="p-4 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-blue-400">Защита бронированного пера:</span>
            </div>
            <div className="text-sm text-blue-300">
              При проигрыше вы сохраните {protection.protectionPercent}% ставки ({protection.savedAmount} монет)
            </div>
            <div className="text-lg font-bold text-blue-400 mt-1">
              Потеря при проигрыше: -{tempBet - protection.savedAmount}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
