"use client"

import type React from "react"
import { addItemToInventory, updatePlayerCoins } from "@/lib/player-service"

import { useState } from "react"
import { Coins, ShoppingCart, Eye, Shield } from "lucide-react"

type ShopItem = {
  id: string
  name: string
  description: string
  price: number
  icon: React.ReactNode
  category: "hunter" | "duck" | "universal"
  effect: string
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: "improved-binoculars",
    name: "Бинокль",
    description: "Позволяет подсветить клетку и увидеть что в ней",
    price: 30,
    icon: <Eye className="h-4 w-4" />,
    category: "hunter",
    effect: "Разведка клетки",
  },
  {
    id: "armored-feather",
    name: "Бронированное перо",
    description: "Защищает от одного выстрела в игре",
    price: 40,
    icon: <Shield className="h-4 w-4" />,
    category: "duck",
    effect: "Защита от выстрела",
  },
]

type Props = {
  playerRole: "hunter" | "duck" | null
  coins: number
  purchasedItems: string[]
  onPurchase: (itemId: string, price: number) => void
  playerId?: string
  onCoinsUpdate?: (newCoins: number) => void
}

export default function Shop({ playerRole, coins, purchasedItems, onPurchase, playerId, onCoinsUpdate }: Props) {
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const availableItems = SHOP_ITEMS.filter((item) => {
    if (!playerRole) return item.category === "universal"
    return item.category === playerRole || item.category === "universal"
  })

  const handlePurchase = async (item: ShopItem) => {
    if (coins >= item.price && !purchasedItems.includes(item.id) && playerId) {
      setPurchasing(item.id)
      try {
        await addItemToInventory(playerId, item.id, 1)
        const newCoins = coins - item.price
        await updatePlayerCoins(playerId, newCoins)

        onPurchase(item.id, item.price)
        if (onCoinsUpdate) {
          onCoinsUpdate(newCoins)
        }
      } catch (error) {
        console.error("Ошибка при покупке предмета:", error)
        alert("Не удалось купить предмет. Попробуйте еще раз.")
      } finally {
        setPurchasing(null)
      }
    }
  }

  return (
    <div className="game-card animate-slide-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">🛒 Магазин улучшений</h3>
            <p className="text-slate-400">Подготовьтесь к охоте</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl shadow-lg shadow-yellow-500/25">
          <Coins className="h-5 w-5 text-white" />
          <span className="font-bold text-white text-lg">{coins}</span>
        </div>
      </div>

      {!playerRole ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎭</div>
          <div className="text-slate-300 text-lg">Выберите роль, чтобы увидеть доступные улучшения</div>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {availableItems.map((item) => {
              const isPurchased = purchasedItems.includes(item.id)
              const canAfford = coins >= item.price
              const canPurchase = canAfford && !isPurchased
              const isPurchasing = purchasing === item.id

              return (
                <div
                  key={item.id}
                  className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                    isPurchased
                      ? "border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20 animate-pulse-glow"
                      : canPurchase
                        ? "border-slate-600 bg-slate-800/50 hover:border-cyan-400 hover:bg-slate-700/50 hover:scale-105"
                        : "border-slate-700 bg-slate-800/30 opacity-60"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl ${
                            item.category === "hunter"
                              ? "bg-gradient-to-br from-amber-400 to-orange-500"
                              : item.category === "duck"
                                ? "bg-gradient-to-br from-emerald-400 to-green-500"
                                : "bg-gradient-to-br from-blue-400 to-cyan-500"
                          }`}
                        >
                          {item.category === "hunter" ? "🏹" : item.category === "duck" ? "🦆" : "⚡"}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white mb-1">{item.name}</h4>
                          <p className="text-slate-400 text-sm mb-2">{item.description}</p>
                          <div className="px-3 py-1 bg-slate-700 rounded-lg text-xs text-slate-300 inline-block">
                            {item.effect}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-3">
                          <Coins className="h-5 w-5 text-yellow-400" />
                          <span className="font-bold text-xl text-white">{item.price}</span>
                        </div>
                        {isPurchased ? (
                          <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold animate-pulse-glow">
                            ✅ Куплено
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePurchase(item)}
                            disabled={!canPurchase || isPurchasing}
                            className={`px-6 py-2 rounded-xl font-bold transition-all duration-300 ${
                              canPurchase
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:scale-105 shadow-lg shadow-blue-500/25"
                                : "bg-slate-700 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {isPurchasing ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Покупка...
                              </div>
                            ) : canAfford ? (
                              "💰 Купить"
                            ) : (
                              "💸 Недостаточно монет"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {canPurchase && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-300 rounded-2xl pointer-events-none"></div>
                  )}
                </div>
              )
            })}
          </div>

          {availableItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚫</div>
              <div className="text-slate-300 text-lg">Нет доступных предметов для вашей роли</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
