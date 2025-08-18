"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground text-sm">Загрузка...</p>
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
      description: "Найди и поймай утку",
    },
    {
      id: "duck",
      name: "Утка",
      icon: Feather,
      level: player?.duck_level || 1,
      description: "Скрывайся и выживи",
    },
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Выбор роли</h1>
            <p className="text-sm text-muted-foreground">Выберите персонажа</p>
          </div>
        </div>

        <div className="space-y-4">
          {roles.map((role) => {
            const Icon = role.icon

            return (
              <div
                key={role.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleRoleSelect(role.id as "hunter" | "duck")}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-card-foreground">{role.name}</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Ур. {role.level}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">Нажмите на роль чтобы продолжить</p>
        </div>
      </div>
    </div>
  )
}
