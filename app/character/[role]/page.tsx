"use client"

import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Target, Feather, Coins, Package, Zap, Trophy, Users, Calendar } from "lucide-react"
import { usePlayer } from "@/contexts/player-context"
import Inventory from "@/components/inventory"

export default function CharacterPage() {
  const router = useRouter()
  const params = useParams()
  const role = params.role as "hunter" | "duck"
  const { player, loading } = usePlayer()
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "perks">("overview")

  const handleBack = () => {
    router.push("/role-select")
  }

  const handleStartGame = () => {
    router.push(`/multiplayer?role=${role}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка данных персонажа...</p>
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Ошибка загрузки данных</p>
          <Button onClick={handleBack} className="mt-4">
            Назад
          </Button>
        </div>
      </div>
    )
  }

  const currentLevel = role === "hunter" ? player.hunter_level : player.duck_level
  const currentExp = role === "hunter" ? player.hunter_experience : player.duck_experience
  const progressPercent = currentExp % 100
  const roleIcon = role === "hunter" ? Target : Feather
  const RoleIcon = roleIcon

  const roleStats = {
    hunter: {
      gamesPlayed: Math.floor(currentLevel * 3 + Math.random() * 10),
      wins: Math.floor(currentLevel * 1.5 + Math.random() * 5),
      losses: Math.floor(currentLevel * 1.5 + Math.random() * 5),
      accuracy: Math.floor(60 + Math.random() * 30),
    },
    duck: {
      gamesPlayed: Math.floor(currentLevel * 3 + Math.random() * 10),
      wins: Math.floor(currentLevel * 2 + Math.random() * 5),
      losses: Math.floor(currentLevel * 1 + Math.random() * 5),
      survivalRate: Math.floor(65 + Math.random() * 25),
    },
  }

  const stats = roleStats[role]

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button onClick={handleBack} variant="outline" className="minimal-button-secondary bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold capitalize">{role === "hunter" ? "Охотник" : "Утка"}</h1>
              <p className="text-sm text-muted-foreground">{player.username}</p>
            </div>
            <Button onClick={handleStartGame} className="minimal-button">
              Играть
            </Button>
          </div>

          {/* Character Overview */}
          <Card className="minimal-card">
            <CardHeader className="text-center pb-4">
              <div className={`mx-auto mb-4 p-6 rounded-full ${role === "hunter" ? "bg-orange-100" : "bg-blue-100"}`}>
                <RoleIcon className={`h-10 w-10 ${role === "hunter" ? "text-orange-600" : "text-blue-600"}`} />
              </div>
              <CardTitle className="text-xl">
                <span className={role === "hunter" ? "text-orange-600" : "text-blue-600"}>
                  {role === "hunter" ? "Охотник" : "Утка"}
                </span>
                <Badge variant="secondary" className="ml-2">
                  Уровень {currentLevel}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Coins className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-semibold">{player.coins}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Монеты</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="h-4 w-4 text-primary mr-1" />
                    <span className="font-semibold">{progressPercent}/100</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Опыт</p>
                </div>
              </div>

              {/* Experience Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Прогресс до следующего уровня</span>
                  <span>{progressPercent}/100</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 overflow-x-auto">
            <Button
              variant={activeTab === "overview" ? "default" : "outline"}
              onClick={() => setActiveTab("overview")}
              className="minimal-button-secondary whitespace-nowrap"
            >
              Обзор
            </Button>
            <Button
              variant={activeTab === "inventory" ? "default" : "outline"}
              onClick={() => setActiveTab("inventory")}
              className="minimal-button-secondary whitespace-nowrap"
            >
              <Package className="h-4 w-4 mr-1" />
              Инвентарь
            </Button>
            <Button
              variant={activeTab === "perks" ? "default" : "outline"}
              onClick={() => setActiveTab("perks")}
              className="minimal-button-secondary whitespace-nowrap"
            >
              <Zap className="h-4 w-4 mr-1" />
              Перки
            </Button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === "overview" && (
              <div className="space-y-4">
                <Card className="minimal-card">
                  <CardHeader>
                    <CardTitle>Статистика {role === "hunter" ? "охотника" : "утки"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Calendar className="h-4 w-4 text-primary mr-1" />
                          <span className="font-semibold">{stats.gamesPlayed}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Игр сыграно</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Trophy className="h-4 w-4 text-green-500 mr-1" />
                          <span className="font-semibold">{stats.wins}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Победы</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Users className="h-4 w-4 text-red-500 mr-1" />
                          <span className="font-semibold">{stats.losses}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Поражения</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Target className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="font-semibold">
                            {role === "hunter" ? `${stats.accuracy}%` : `${(stats as any).survivalRate}%`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {role === "hunter" ? "Точность" : "Выживаемость"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader>
                    <CardTitle>Способности роли</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {role === "hunter" ? (
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                          Стрельба по клеткам
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                          Использование бинокля
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                          Тактическое планирование
                        </li>
                      </ul>
                    ) : (
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          Быстрое перемещение
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          Скрытность
                        </li>
                        <li className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          Защитные способности
                        </li>
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "inventory" && (
              <Card className="minimal-card">
                <CardHeader>
                  <CardTitle>Мой инвентарь</CardTitle>
                </CardHeader>
                <CardContent>
                  <Inventory playerId={player.id} />
                </CardContent>
              </Card>
            )}

            {activeTab === "perks" && (
              <Card className="minimal-card">
                <CardHeader>
                  <CardTitle>Перки и улучшения</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {role === "hunter" ? (
                      <div className="space-y-3">
                        <div className="p-3 border border-border rounded-lg">
                          <h4 className="font-semibold text-sm mb-1">Бинокль</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            Подсвечивает 1 клетку где нет утки. +1 уровень персонажу.
                          </p>
                          <Badge variant="outline">1 использование за уровень</Badge>
                        </div>
                        <div className="p-3 border border-border rounded-lg opacity-50">
                          <h4 className="font-semibold text-sm mb-1">Дополнительный выстрел</h4>
                          <p className="text-xs text-muted-foreground mb-2">Дает дополнительный выстрел в раунде.</p>
                          <Badge variant="secondary">Скоро</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 border border-border rounded-lg">
                          <h4 className="font-semibold text-sm mb-1">Бронированное перо</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            Защищает часть ставки при проигрыше. 3 уровня: 5%, 10%, 15%.
                          </p>
                          <Badge variant="outline">Защита ставки</Badge>
                        </div>
                        <div className="p-3 border border-border rounded-lg opacity-50">
                          <h4 className="font-semibold text-sm mb-1">Призрачный полет</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            Позволяет пролететь через обстрелянные клетки.
                          </p>
                          <Badge variant="secondary">Скоро</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Button */}
          <div className="text-center">
            <Button onClick={handleStartGame} className="minimal-button text-lg px-8 py-3">
              Начать поиск игры
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
