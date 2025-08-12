"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Search, Shield, Zap, RefreshCw } from "lucide-react"
import type { InventoryItem } from "@/lib/supabase/client"
import { getPlayerInventory } from "@/lib/player-service"

interface InventoryProps {
  playerId?: string
}

const itemIcons: Record<string, React.ReactNode> = {
  binoculars: <Search className="h-4 w-4" />,
  "improved-binoculars": <Search className="h-4 w-4" />, // добавляем соответствие для ID из магазина
  armored_feather: <Shield className="h-4 w-4" />,
  "armored-feather": <Shield className="h-4 w-4" />, // добавляем соответствие для ID из магазина
  extra_shots: <Zap className="h-4 w-4" />,
}

const itemNames: Record<string, string> = {
  binoculars: "Бинокль",
  "improved-binoculars": "Бинокль",
  armored_feather: "Бронированное перо",
  "armored-feather": "Бронированное перо",
  extra_shots: "Дополнительные выстрелы",
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
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Инвентарь
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {inventory.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Инвентарь пуст. Купите предметы в магазине!</p>
        ) : (
          <div className="space-y-3">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-600 dark:text-gray-400">
                    {itemIcons[item.item_type] || <Package className="h-4 w-4" />}
                  </div>
                  <span className="font-medium">{itemNames[item.item_type] || item.item_type}</span>
                </div>
                <Badge variant="outline">{item.quantity}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
