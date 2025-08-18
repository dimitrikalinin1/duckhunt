"use client"

import { useRouter } from "next/navigation"
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
      color: "text-orange-400",
      bgGlow: "from-orange-500/20 to-red-500/20",
    },
    {
      id: "duck",
      name: "Утка",
      icon: Feather,
      level: player?.duck_level || 1,
      experience: player?.duck_experience || 0,
      emoji: "🦆",
      color: "text-cyan-400",
      bgGlow: "from-blue-500/20 to-cyan-500/20",
    },
  ]

  return (
    <div className="min-h-screen bg-background p-4 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between max-w-full">
            <Button onClick={handleBack} variant="outline" size="sm" className="flex-shrink-0 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <h1 className="text-2xl font-bold text-center flex-1 px-4 truncate">Выбор роли</h1>
            <div className="w-16 flex-shrink-0"></div>
          </div>

          <div className="space-y-6">
            <div className="role-scroll-container px-2">
              {roles.map((role, index) => {
                const Icon = role.icon
                const progressPercent = role.experience % 100

                return (
                  <div
                    key={role.id}
                    className="role-scroll-item animate-slide-up opacity-0"
                    style={{
                      animationDelay: `${index * 0.2}s`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <div className="role-card animate-float-gentle">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${role.bgGlow} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      ></div>

                      <div className="relative space-y-6">
                        <div className="text-center space-y-4">
                          <div className="relative inline-block">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all duration-300"></div>
                            <div className="relative p-6 rounded-full bg-gradient-to-br from-card to-muted border-2 border-primary/30 group-hover:border-primary/60 transition-all duration-300">
                              <Icon
                                className={`h-12 w-12 ${role.color} group-hover:scale-110 transition-transform duration-300`}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-3">
                              <span className="text-4xl group-hover:animate-bounce">{role.emoji}</span>
                              <h3 className="text-2xl font-bold">{role.name}</h3>
                            </div>
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                              Уровень {role.level}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Опыт до следующего уровня</span>
                            <span className="font-mono">{progressPercent}/100</span>
                          </div>
                          <Progress value={progressPercent} className="h-3 bg-muted/50" />
                        </div>

                        <Button
                          onClick={() => handleRoleSelect(role.id as "hunter" | "duck")}
                          className="game-button w-full animate-glow-pulse"
                          size="lg"
                        >
                          <Icon className="h-5 w-5 mr-2" />
                          Играть за {role.name}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="game-panel max-w-2xl mx-auto">
              <h4 className="font-bold mb-4 text-center text-lg">Правила игры</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 font-semibold">
                    <Target className="h-5 w-5 text-orange-400" />
                    <span>Охотник</span>
                  </div>
                  <ul className="space-y-2 text-muted-foreground ml-8">
                    <li>• Найди и поймай утку</li>
                    <li>• Используй бинокль для поиска</li>
                    <li>• Ограниченное количество выстрелов</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 font-semibold">
                    <Feather className="h-5 w-5 text-cyan-400" />
                    <span>Утка</span>
                  </div>
                  <ul className="space-y-2 text-muted-foreground ml-8">
                    <li>• Скрывайся от охотника</li>
                    <li>• Избегай попадания выстрелов</li>
                    <li>• Используй способности для защиты</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
