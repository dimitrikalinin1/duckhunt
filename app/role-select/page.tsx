"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Target, Feather } from "lucide-react"
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
      level: player?.hunter_level || 1,
      experience: player?.hunter_experience || 0,
      emoji: "🏹",
      gradient: "from-orange-500 to-red-500",
    },
    {
      id: "duck",
      name: "Утка",
      icon: Feather,
      level: player?.duck_level || 1,
      experience: player?.duck_experience || 0,
      emoji: "🦆",
      gradient: "from-blue-500 to-cyan-500",
    },
  ]

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button onClick={handleBack} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <h1 className="text-2xl font-bold">Выбор роли</h1>
            <div className="w-16"></div>
          </div>

          <div className="space-y-4">
            {roles.map((role, index) => {
              const Icon = role.icon
              const progressPercent = role.experience % 100

              return (
                <div
                  key={role.id}
                  className="animate-slide-up opacity-0"
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    animationFillMode: "forwards",
                  }}
                >
                  <Card
                    className="group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-card/50 backdrop-blur-sm"
                    onClick={() => handleRoleSelect(role.id as "hunter" | "duck")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${role.gradient} rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
                          ></div>
                          <div
                            className={`relative p-3 rounded-full bg-gradient-to-r ${role.gradient} group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl group-hover:animate-bounce">{role.emoji}</span>
                            <h3 className="text-xl font-bold">{role.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              Ур. {role.level}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Опыт</span>
                              <span>{progressPercent}/100</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                        </div>

                        <Button
                          className={`bg-gradient-to-r ${role.gradient} hover:shadow-md transition-all duration-300 group-hover:scale-105`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRoleSelect(role.id as "hunter" | "duck")
                          }}
                        >
                          Играть
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>

          <Card className="border border-primary/20 bg-card/30 backdrop-blur-sm">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-center">Основы игры</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <Target className="h-4 w-4 text-orange-500" />
                    Охотник
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground ml-6">
                    <li>• Найди и поймай утку</li>
                    <li>• Используй бинокль</li>
                    <li>• Ограниченные выстрелы</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <Feather className="h-4 w-4 text-blue-500" />
                    Утка
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground ml-6">
                    <li>• Скрывайся от охотника</li>
                    <li>• Избегай выстрелов</li>
                    <li>• Используй перки</li>
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
