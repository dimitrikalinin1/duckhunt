"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Package, Search, Shield, Zap, RefreshCw } from "lucide-react"
import type { InventoryItem } from "@/lib/supabase/client"
import { getPlayerInventory } from "@/lib/player-service"

interface InventoryProps {
  playerId?: string
}

const itemIcons: Record<string, React.ReactNode> = {
  binoculars: <Search className="h-5 w-5" />,
  "improved-binoculars": <Search className="h-5 w-5" />,
  armored_feather: <Shield className="h-5 w-5" />,
  "armored-feather": <Shield className="h-5 w-5" />,
  extra_shots: <Zap className="h-5 w-5" />,
}

const itemNames: Record<string, string> = {
  binoculars: "Бинокль",
  "improved-binoculars": "Бинокль",
  armored_feather: "Бронированное перо",
  "armored-feather": "Бронированное перо",
  extra_shots: "Дополнительные выстрелы",
}

const itemEmojis: Record<string, string> = {
  binoculars: "🔍",
  "improved-binoculars": "🔍",
  armored_feather: "🛡️",
  "armored-feather": "🛡️",
  extra_shots: "💥",
}

export default function Inventory({ playerId }: InventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadInventory = async () => {
    if (!playerId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const items = await getPlayerInventory(playerId)
      setInventory(items)
    } catch (error) {
      console.error("Error loading inventory:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [playerId])

  const handleRefresh = () => {
    loadInventory()
  }

  if (loading) {
    return (
      <div className="game-card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded-xl w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded-lg w-1/2"></div>
          <div className="h-4 bg-slate-700 rounded-lg w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-card animate-slide-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">🎒 Инвентарь</h3>
            <p className="text-slate-400">Ваши предметы</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center hover:bg-slate-700/50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 text-slate-300 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {inventory.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <div className="text-slate-300 text-lg mb-2">Инвентарь пуст</div>
          <div className="text-slate-400 text-sm">Купите предметы в магазине!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {inventory.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-2xl">
                  {itemEmojis[item.item_type] || "📦"}
                </div>
                <div>
                  <div className="font-bold text-white text-lg">{itemNames[item.item_type] || item.item_type}</div>
                  <div className="text-slate-400 text-sm">Предмет инвентаря</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg">
                  <span className="text-blue-300 font-bold">×{item.quantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
