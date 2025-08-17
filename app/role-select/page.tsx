"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
      color: "orange",
      level: player?.hunter_level || 1,
      experience: player?.hunter_experience || 0,
      description: "Выследи и поймай утку",
      abilities: ["Стрельба по клеткам", "Использование бинокля", "Ограниченные патроны"],
    },
    {
      id: "duck",
      name: "Утка",
      icon: Feather,
      color: "blue",
      level: player?.duck_level || 1,
      experience: player?.duck_experience || 0,
      description: "Скрывайся и выживай",
      abilities: ["Перемещение по полю", "Скрытность", "Защитные перки"],
    },
  ]

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button onClick={handleBack} variant="outline" className="minimal-button-secondary bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <h1 className="text-2xl font-bold">Выбор роли</h1>
            <div className="w-20"></div>
          </div>

          {/* Role Selection */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Выберите свою роль</h2>
            <p className="text-muted-foreground">Каждая роль имеет уникальные способности и стратегии</p>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max px-4">
              {roles.map((role) => {
                const Icon = role.icon
                const progressPercent = role.experience % 100

                return (
                  <Card
                    key={role.id}
                    className="minimal-card hover:shadow-lg transition-all duration-300 cursor-pointer group w-80 flex-shrink-0"
                    onClick={() => handleRoleSelect(role.id as "hunter" | "duck")}
                  >
                    <CardHeader className="text-center pb-4">
                      <div
                        className={`mx-auto mb-4 p-6 rounded-full ${role.color === "orange" ? "bg-orange-100 group-hover:bg-orange-200" : "bg-blue-100 group-hover:bg-blue-200"} transition-colors`}
                      >
                        <Icon
                          className={`h-10 w-10 ${role.color === "orange" ? "text-orange-600" : "text-blue-600"}`}
                        />
                      </div>
                      <CardTitle
                        className={`text-2xl font-bold ${role.color === "orange" ? "text-orange-600" : "text-blue-600"}`}
                      >
                        {role.name}
                      </CardTitle>
                      <p className="text-muted-foreground">{role.description}</p>
                      <Badge variant="secondary" className="mx-auto">
                        Уровень {role.level}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Опыт</span>
                          <span>{role.experience % 100}/100</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Способности:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {role.abilities.map((ability, index) => (
                            <li key={index}>• {ability}</li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        className="w-full minimal-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRoleSelect(role.id as "hunter" | "duck")
                        }}
                      >
                        Играть
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Game Rules */}
          <Card className="minimal-card max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Правила игры</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Для охотника:</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Игра начинается с хода утки</li>
                    <li>• Используйте бинокль для разведки</li>
                    <li>• Ограниченное количество выстрелов</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Для утки:</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Выберите начальную позицию</li>
                    <li>• Избегайте обстрелянных клеток</li>
                    <li>• Используйте защитные перки</li>
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
