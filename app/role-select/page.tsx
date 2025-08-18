"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Target, Feather, Zap, Shield, Eye, Wind } from "lucide-react"
import { usePlayer } from "@/contexts/player-context"
import { GameIcons } from "@/components/game-icons"

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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground font-medium text-lg">Загрузка арены...</p>
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
      iconComponent: GameIcons.Hunter,
      color: "text-primary",
      bgGlow: "from-primary/30 to-secondary/20",
      borderColor: "border-primary/50",
      abilities: [
        { icon: Eye, name: "Бинокль", desc: "Обнаружение пустых клеток" },
        { icon: Zap, name: "Точный выстрел", desc: "Увеличенная точность" },
      ],
    },
    {
      id: "duck",
      name: "Утка",
      icon: Feather,
      level: player?.duck_level || 1,
      experience: player?.duck_experience || 0,
      iconComponent: GameIcons.Duck,
      color: "text-secondary",
      bgGlow: "from-secondary/30 to-accent/20",
      borderColor: "border-secondary/50",
      abilities: [
        { icon: Wind, name: "Перелет", desc: "Смена позиции" },
        { icon: Shield, name: "Броня", desc: "Защита от урона" },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background p-4 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-8">
          <div className="flex items-center justify-between max-w-full">
            <Button
              onClick={handleBack}
              variant="outline"
              size="sm"
              className="game-button-secondary text-sm px-4 py-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div className="text-center flex-1 px-4">
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  ВЫБОР РОЛИ
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-2">Выберите своего персонажа</p>
            </div>
            <div className="w-20 flex-shrink-0"></div>
          </div>

          <div className="space-y-8">
            <div className="role-scroll-container px-2">
              {roles.map((role, index) => {
                const Icon = role.icon
                const progressPercent = role.experience % 100

                return (
                  <div
                    key={role.id}
                    className="role-scroll-item animate-slide-up opacity-0"
                    style={{
                      animationDelay: `${index * 0.3}s`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <div className={`role-card group hover:${role.borderColor} animate-float-gentle`}>
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${role.bgGlow} rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500`}
                      ></div>

                      <div className="relative space-y-6">
                        {/* Character Header */}
                        <div className="text-center space-y-4">
                          <div className="relative inline-block">
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${role.bgGlow} rounded-full blur-2xl group-hover:blur-xl transition-all duration-500`}
                            ></div>
                            <div
                              className={`relative p-8 rounded-full bg-gradient-to-br from-card to-muted border-3 ${role.borderColor} group-hover:border-opacity-100 transition-all duration-300 shadow-2xl`}
                            >
                              <Icon
                                className={`h-16 w-16 ${role.color} group-hover:scale-110 transition-transform duration-300`}
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-center gap-4">
                              <div className="w-16 h-16 group-hover:animate-bounce">
                                <role.iconComponent />
                              </div>
                              <div className="text-center">
                                <h3 className="text-3xl font-black text-foreground">{role.name}</h3>
                                <Badge
                                  variant="secondary"
                                  className={`text-sm px-4 py-1 mt-2 bg-${role.color.split("-")[1]}/20 border-${role.color.split("-")[1]}/30`}
                                >
                                  Уровень {role.level}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Experience Progress */}
                        <div className="space-y-3 p-4 bg-muted/10 rounded-lg border border-border/50">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span className="font-medium">Опыт до следующего уровня</span>
                            <span className="font-mono font-bold">{progressPercent}/100</span>
                          </div>
                          <Progress value={progressPercent} className="h-4 bg-muted/30" />
                        </div>

                        {/* Abilities */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                            Способности
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {role.abilities.map((ability, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-muted/10 rounded-lg border border-border/30 hover:border-border/60 transition-colors"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <ability.icon className={`h-4 w-4 ${role.color}`} />
                                  <span className="text-xs font-bold text-foreground">{ability.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{ability.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Play Button */}
                        <Button
                          onClick={() => handleRoleSelect(role.id as "hunter" | "duck")}
                          className="game-button w-full text-xl py-6 font-black tracking-wide animate-glow-pulse"
                          size="lg"
                        >
                          <Icon className="h-6 w-6 mr-3" />
                          ИГРАТЬ ЗА {role.name.toUpperCase()}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="game-panel max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h4 className="text-2xl font-black text-foreground mb-2">ПРАВИЛА ИГРЫ</h4>
                <p className="text-muted-foreground">Изучите особенности каждой роли</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-4 font-bold text-lg">
                    <div className="p-3 bg-primary/20 rounded-full">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-foreground">Охотник</span>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Найди и поймай утку на игровом поле</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Используй бинокль для обнаружения пустых клеток</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Ограниченное количество выстрелов и способностей</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4 p-6 bg-secondary/5 rounded-lg border border-secondary/20">
                  <div className="flex items-center gap-4 font-bold text-lg">
                    <div className="p-3 bg-secondary/20 rounded-full">
                      <Feather className="h-6 w-6 text-secondary" />
                    </div>
                    <span className="text-foreground">Утка</span>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Скрывайся от охотника и выживи</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Используй перелет для смены позиции</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Применяй защитные способности и перки</span>
                    </li>
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
