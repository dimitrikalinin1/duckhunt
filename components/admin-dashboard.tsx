"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { logoutAdmin } from "@/lib/admin-auth"
import {
  getPlayersForAdmin,
  getPlayerInventory,
  updatePlayerCoins,
  updatePlayerExperience,
  calculateLevelFromExperience,
  calculateExperienceFromLevel,
} from "@/lib/admin-service"

interface PlayerData {
  id: string
  telegram_id: string
  username: string
  coins: number
  hunter_level: number
  hunter_experience: number
  duck_level: number
  duck_experience: number
  created_at: string
  last_played: string
}

interface InventoryItem {
  id: string
  item_type: string
  quantity: number
}

export default function AdminDashboard() {
  const [players, setPlayers] = useState<PlayerData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null)
  const [playerInventory, setPlayerInventory] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editCoins, setEditCoins] = useState(0)
  const [editHunterLevel, setEditHunterLevel] = useState(1)
  const [editDuckLevel, setEditDuckLevel] = useState(1)
  const [editHunterExperience, setEditHunterExperience] = useState(0)
  const [editDuckExperience, setEditDuckExperience] = useState(0)
  const [editHunterTotalExp, setEditHunterTotalExp] = useState(0)
  const [editDuckTotalExp, setEditDuckTotalExp] = useState(0)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    try {
      const playersData = await getPlayersForAdmin()
      setPlayers(playersData)
    } catch (error) {
      console.error("Error loading players:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logoutAdmin()
    router.push("/admin/login")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPlayerLevel = (player: PlayerData) => {
    return Math.max(player.hunter_level, player.duck_level)
  }

  const loadPlayerInventory = async (playerId: string) => {
    setInventoryLoading(true)
    try {
      const inventory = await getPlayerInventory(playerId)
      setPlayerInventory(inventory)
    } catch (error) {
      console.error("Error loading player inventory:", error)
      setPlayerInventory([])
    } finally {
      setInventoryLoading(false)
    }
  }

  const handlePlayerClick = (player: PlayerData) => {
    setSelectedPlayer(player)
    setEditCoins(player.coins)
    setEditHunterLevel(player.hunter_level)
    setEditDuckLevel(player.duck_level)
    setEditHunterExperience(player.hunter_experience)
    setEditDuckExperience(player.duck_experience)
    setEditHunterTotalExp(calculateExperienceFromLevel(player.hunter_level, player.hunter_experience))
    setEditDuckTotalExp(calculateExperienceFromLevel(player.duck_level, player.duck_experience))
    setIsEditing(false)
    loadPlayerInventory(player.id)
  }

  const handleHunterExpChange = (totalExp: number) => {
    setEditHunterTotalExp(totalExp)
    const { level, currentExp } = calculateLevelFromExperience(totalExp)
    setEditHunterLevel(level)
    setEditHunterExperience(currentExp)
  }

  const handleDuckExpChange = (totalExp: number) => {
    setEditDuckTotalExp(totalExp)
    const { level, currentExp } = calculateLevelFromExperience(totalExp)
    setEditDuckLevel(level)
    setEditDuckExperience(currentExp)
  }

  const handleHunterLevelChange = (level: number) => {
    setEditHunterLevel(level)
    const totalExp = calculateExperienceFromLevel(level, editHunterExperience)
    setEditHunterTotalExp(totalExp)
  }

  const handleDuckLevelChange = (level: number) => {
    setEditDuckLevel(level)
    const totalExp = calculateExperienceFromLevel(level, editDuckExperience)
    setEditDuckTotalExp(totalExp)
  }

  const handleUpdatePlayer = async () => {
    if (!selectedPlayer) return

    setUpdating(true)
    try {
      const coinsSuccess = await updatePlayerCoins(selectedPlayer.id, editCoins)
      const hunterSuccess = await updatePlayerExperience(selectedPlayer.id, "hunter", editHunterTotalExp)
      const duckSuccess = await updatePlayerExperience(selectedPlayer.id, "duck", editDuckTotalExp)

      if (coinsSuccess && hunterSuccess && duckSuccess) {
        const updatedPlayer = {
          ...selectedPlayer,
          coins: editCoins,
          hunter_level: editHunterLevel,
          duck_level: editDuckLevel,
          hunter_experience: editHunterExperience,
          duck_experience: editDuckExperience,
        }
        setSelectedPlayer(updatedPlayer)
        setPlayers(players.map((p) => (p.id === selectedPlayer.id ? updatedPlayer : p)))
        setIsEditing(false)
        alert("Данные игрока успешно обновлены!")
      } else {
        alert("Ошибка при обновлении данных игрока")
      }
    } catch (error) {
      console.error("Error updating player:", error)
      alert("Ошибка при обновлении данных игрока")
    } finally {
      setUpdating(false)
    }
  }

  const getItemDisplayName = (itemType: string) => {
    const itemNames: Record<string, string> = {
      binoculars: "Бинокль",
      armored_feather: "Бронированное перо",
      extra_shot: "Дополнительный выстрел",
      ghost_flight: "Призрачный полет",
      stealth_mode: "Режим скрытности",
    }
    return itemNames[itemType] || itemType
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка данных игроков...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Админ-панель</h1>
            <p className="text-muted-foreground">Управление игроками и статистикой</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="minimal-button-secondary bg-transparent">
            Выйти
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="minimal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Всего игроков</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{players.length}</div>
            </CardContent>
          </Card>
          <Card className="minimal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Активных игроков</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {players.filter((p) => new Date(p.last_played) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </div>
            </CardContent>
          </Card>
          <Card className="minimal-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Общий баланс</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{players.reduce((sum, p) => sum + p.coins, 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Players List */}
        <Card className="minimal-card">
          <CardHeader>
            <CardTitle>Список игроков</CardTitle>
            <CardDescription>Все зарегистрированные игроки и их статистика</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => handlePlayerClick(player)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{player.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="font-medium">{player.username}</div>
                      <div className="text-sm text-muted-foreground">ID: {player.telegram_id}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium">{player.coins} монет</div>
                      <div className="text-sm text-muted-foreground">Уровень {getPlayerLevel(player)}</div>
                    </div>
                    <Badge variant="secondary">
                      {new Date(player.last_played) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                        ? "Активен"
                        : "Неактивен"}
                    </Badge>
                  </div>
                </div>
              ))}
              {players.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Игроки не найдены</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Player Details Modal */}
        {selectedPlayer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl minimal-card max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Детали игрока</CardTitle>
                <CardDescription>{selectedPlayer.username}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="font-medium mb-3">Основная информация</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telegram ID:</span>
                        <span className="font-mono">{selectedPlayer.telegram_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Баланс:</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editCoins}
                            onChange={(e) => setEditCoins(Number(e.target.value))}
                            className="w-20 px-2 py-1 text-xs border border-border rounded"
                            min="0"
                          />
                        ) : (
                          <span className="font-semibold">{selectedPlayer.coins} монет</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Регистрация:</span>
                        <span>{formatDate(selectedPlayer.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Последняя игра:</span>
                        <span>{formatDate(selectedPlayer.last_played)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Character Levels with Progress Bars */}
                <div>
                  <h4 className="font-medium mb-3">Уровни персонажей</h4>
                  <div className="space-y-4">
                    {/* Hunter Level */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">🏹 Охотник</span>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <div className="text-xs text-muted-foreground">Уровень:</div>
                              <input
                                type="number"
                                value={editHunterLevel}
                                onChange={(e) => handleHunterLevelChange(Number(e.target.value))}
                                className="w-16 px-2 py-1 text-xs border border-border rounded"
                                min="1"
                                max="100"
                              />
                            </>
                          ) : (
                            <Badge variant="secondary">Уровень {selectedPlayer.hunter_level}</Badge>
                          )}
                        </div>
                      </div>
                      <Progress value={selectedPlayer.hunter_experience} className="h-2" />
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          {selectedPlayer.hunter_experience}/100 опыта
                        </div>
                        {isEditing && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Общий опыт:</span>
                            <input
                              type="number"
                              value={editHunterTotalExp}
                              onChange={(e) => handleHunterExpChange(Number(e.target.value))}
                              className="w-20 px-2 py-1 text-xs border border-border rounded"
                              min="0"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Duck Level */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">🦆 Утка</span>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <div className="text-xs text-muted-foreground">Уровень:</div>
                              <input
                                type="number"
                                value={editDuckLevel}
                                onChange={(e) => handleDuckLevelChange(Number(e.target.value))}
                                className="w-16 px-2 py-1 text-xs border border-border rounded"
                                min="1"
                                max="100"
                              />
                            </>
                          ) : (
                            <Badge variant="secondary">Уровень {selectedPlayer.duck_level}</Badge>
                          )}
                        </div>
                      </div>
                      <Progress value={selectedPlayer.duck_experience} className="h-2" />
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">{selectedPlayer.duck_experience}/100 опыта</div>
                        {isEditing && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Общий опыт:</span>
                            <input
                              type="number"
                              value={editDuckTotalExp}
                              onChange={(e) => handleDuckExpChange(Number(e.target.value))}
                              className="w-20 px-2 py-1 text-xs border border-border rounded"
                              min="0"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Inventory */}
                <div>
                  <h4 className="font-medium mb-3">Инвентарь игрока</h4>
                  {inventoryLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Загрузка инвентаря...</span>
                    </div>
                  ) : playerInventory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {playerInventory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-sm">{getItemDisplayName(item.item_type)}</div>
                            <div className="text-xs text-muted-foreground">Тип: {item.item_type}</div>
                          </div>
                          <Badge variant="outline">x{item.quantity}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">Инвентарь пуст</p>
                    </div>
                  )}
                </div>

                {/* Player Statistics */}
                <div>
                  <h4 className="font-medium mb-3">Статистика</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Общий уровень:</span>
                        <span className="font-semibold">{getPlayerLevel(selectedPlayer)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Общий опыт:</span>
                        <span>{selectedPlayer.hunter_experience + selectedPlayer.duck_experience}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Предметов в инвентаре:</span>
                        <span>{playerInventory.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Статус:</span>
                        <Badge
                          variant={
                            new Date(selectedPlayer.last_played) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                              ? "default"
                              : "secondary"
                          }
                        >
                          {new Date(selectedPlayer.last_played) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                            ? "Активен"
                            : "Неактивен"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons Section */}
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button onClick={handleUpdatePlayer} disabled={updating} className="flex-1 minimal-button">
                        {updating ? "Сохранение..." : "Сохранить"}
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="flex-1 minimal-button-secondary"
                      >
                        Отмена
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setIsEditing(true)} className="flex-1 minimal-button">
                        Редактировать
                      </Button>
                      <Button
                        onClick={() => setSelectedPlayer(null)}
                        variant="outline"
                        className="flex-1 minimal-button-secondary"
                      >
                        Закрыть
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
