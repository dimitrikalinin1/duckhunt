"use client"

import type React from "react"
import { addItemToInventory, updatePlayerCoins } from "@/lib/player-service"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  onCoinsUpdate?: (newCoins: number) => void // добавляем callback для обновления баланса
}

export default function Shop({ playerRole, coins, purchasedItems, onPurchase, playerId, onCoinsUpdate }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "hunter" | "duck">("all")
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (selectedCategory === "all") return true
    return item.category === selectedCategory || item.category === "universal"
  })

  const availableItems = filteredItems.filter((item) => {
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
          onCoinsUpdate(newCoins) // обновляем баланс в родительском компоненте
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Магазин улучшений
          </CardTitle>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="font-bold">{coins}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!playerRole ? (
          <div className="text-center text-muted-foreground py-8">Выберите роль, чтобы увидеть доступные улучшения</div>
        ) : (
          <>
            <div className="grid gap-3">
              {availableItems.map((item) => {
                const isPurchased = purchasedItems.includes(item.id)
                const canAfford = coins >= item.price
                const canPurchase = canAfford && !isPurchased
                const isPurchasing = purchasing === item.id

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isPurchased ? "bg-green-50 dark:bg-green-950 border-green-200" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          item.category === "hunter"
                            ? "bg-amber-100 text-amber-600"
                            : item.category === "duck"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                        <Badge variant="outline" className="mt-1">
                          {item.effect}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold">{item.price}</span>
                      </div>
                      {isPurchased ? (
                        <Badge variant="default">Куплено</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handlePurchase(item)}
                          disabled={!canPurchase || isPurchasing}
                          variant={canPurchase ? "default" : "outline"}
                        >
                          {isPurchasing ? "Покупка..." : canAfford ? "Купить" : "Недостаточно монет"}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {availableItems.length === 0 && (
              <div className="text-center text-muted-foreground py-8">Нет доступных предметов для вашей роли</div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
