"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Target, Feather, Zap, Shield, Eye, Crosshair } from "lucide-react"
import { usePlayer } from "@/contexts/player-context"

export default function RoleSelectPage() {
  const router = useRouter()
  const { player, loading } = usePlayer()

  const handleRoleSelect = (role: "hunter" | "duck") => {
    router.push(`/character/${role}`)
  }

  const handleBack = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  const roles = [
    {
      id: "hunter",
      name: "Охотник",
      icon: Target,
      color: "orange",
      level: player?.hunter_level || 1,
      experience: player?.hunter_experience || 0,
      description: "Выследи и поймай утку",
      emoji: "🏹",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
      abilities: [
        { icon: Crosshair, text: "Точная стрельба" },
        { icon: Eye, text: "Бинокль для разведки" },
        { icon: Zap, text: "Тактическое планирование" },
      ],
    },
    {
      id: "duck",
      name: "Утка",
      icon: Feather,
      color: "blue",
      level: player?.duck_level || 1,
      experience: player?.duck_experience || 0,
      description: "Скрывайся и выживай",
      emoji: "🦆",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
      abilities: [
        { icon: Zap, text: "Быстрое перемещение" },
        { icon: Shield, text: "Защитные способности" },
        { icon: Eye, text: "Скрытность" },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button onClick={handleBack} variant="outline" className="minimal-button-secondary bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Выбор роли
              </h1>
              <p className="text-muted-foreground mt-1">Выберите свой стиль игры</p>
            </div>
            <div className="w-20"></div>
          </div>

          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-3xl"></div>

            <div className="relative overflow-x-auto pb-6">
              <div className="flex gap-8 min-w-max px-8 py-6">
                {roles.map((role, index) => {
                  const Icon = role.icon
                  const progressPercent = role.experience % 100

                  return (
                    <div key={role.id} className="group relative" style={{ animationDelay: `${index * 0.1}s` }}>
                      {/* Glow effect */}
                      <div
                        className={`absolute -inset-1 bg-gradient-to-r ${role.gradient} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                      ></div>

                      <Card
                        className="relative minimal-card hover:shadow-2xl transition-all duration-500 cursor-pointer w-96 flex-shrink-0 border-2 hover:border-primary/30 animate-slide-up"
                        onClick={() => handleRoleSelect(role.id as "hunter" | "duck")}
                      >
                        <CardHeader className="text-center pb-6 relative overflow-hidden">
                          {/* Background pattern */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${role.bgGradient} opacity-30`}></div>

                          <div className="relative z-10">
                            {/* Large emoji display */}
                            <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: "2s" }}>
                              {role.emoji}
                            </div>

                            {/* Role icon with gradient background */}
                            <div
                              className={`mx-auto mb-4 p-4 rounded-full bg-gradient-to-br ${role.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                            >
                              <Icon className="h-8 w-8 text-white" />
                            </div>

                            <CardTitle className="text-2xl font-bold text-foreground mb-2">{role.name}</CardTitle>
                            <p className="text-muted-foreground text-lg">{role.description}</p>

                            <div className="flex items-center justify-center gap-2 mt-3">
                              <Badge variant="secondary" className="text-sm px-3 py-1">
                                Уровень {role.level}
                              </Badge>
                              <Badge variant="outline" className="text-sm px-3 py-1">
                                {role.experience} XP
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                          {/* Experience progress with better styling */}
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm font-medium">
                              <span>Прогресс уровня</span>
                              <span className="text-primary">{progressPercent}/100 XP</span>
                            </div>
                            <div className="relative">
                              <Progress value={progressPercent} className="h-3 bg-secondary" />
                              <div
                                className={`absolute inset-0 bg-gradient-to-r ${role.gradient} opacity-20 rounded-full`}
                              ></div>
                            </div>
                          </div>

                          {/* Enhanced abilities display */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-center">Способности</h4>
                            <div className="space-y-2">
                              {role.abilities.map((ability, abilityIndex) => {
                                const AbilityIcon = ability.icon
                                return (
                                  <div
                                    key={abilityIndex}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                                  >
                                    <div className={`p-1.5 rounded-full bg-gradient-to-br ${role.gradient}`}>
                                      <AbilityIcon className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="text-sm font-medium">{ability.text}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Enhanced play button */}
                          <Button
                            className={`w-full text-lg py-6 bg-gradient-to-r ${role.gradient} hover:shadow-lg hover:scale-105 transition-all duration-300 text-white font-semibold`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRoleSelect(role.id as "hunter" | "duck")
                            }}
                          >
                            <Icon className="h-5 w-5 mr-2" />
                            Играть за {role.name.toLowerCase()}а
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="flex justify-center mt-4">
              <div className="flex gap-2">
                {roles.map((_, index) => (
                  <div key={index} className="w-2 h-2 rounded-full bg-primary/30"></div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground ml-4">Прокрутите для просмотра ролей</p>
            </div>
          </div>

          {/* Enhanced game rules */}
          <Card className="minimal-card max-w-4xl mx-auto border-2 border-primary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Основы игры
                <Feather className="h-6 w-6 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-gradient-to-br from-orange-500 to-red-500">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-bold text-lg">Охотник</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      Игра начинается с хода утки
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      Используйте бинокль для разведки
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      Ограниченное количество выстрелов
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                      <Feather className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-bold text-lg">Утка</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Выберите начальную позицию
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Избегайте обстрелянных клеток
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Используйте защитные перки
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
