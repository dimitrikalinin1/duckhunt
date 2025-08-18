"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Target, Feather } from "lucide-react"
import { usePlayer } from "@/contexts/player-context"

export default function RoleSelectPage() {
  const router = useRouter()
  const { player, loading } = usePlayer()
  const [selectedRole, setSelectedRole] = useState<"hunter" | "duck" | null>(null)

  const handleRoleSelect = (role: "hunter" | "duck") => {
    setSelectedRole(role)
  }

  const handlePlay = () => {
    if (selectedRole) {
      router.push(`/character/${selectedRole}`)
    }
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
      emoji: "🏹",
    },
    {
      id: "duck",
      name: "Утка",
      icon: Feather,
      level: player?.duck_level || 1,
      emoji: "🦆",
    },
  ]

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Выбор роли</h1>
            </div>
            <div className="w-20"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {roles.map((role) => {
              const Icon = role.icon
              const isSelected = selectedRole === role.id

              return (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected ? "border-primary bg-primary/5 shadow-lg" : "hover:border-primary/50 hover:shadow-md"
                  }`}
                  onClick={() => handleRoleSelect(role.id as "hunter" | "duck")}
                >
                  <CardHeader className="text-center pb-3">
                    <div className="text-4xl mb-2">{role.emoji}</div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <Badge variant="secondary" className="text-xs">
                      Уровень {role.level}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {selectedRole && (
            <div className="text-center">
              <Button onClick={handlePlay} size="lg" className="px-8 py-3 text-lg">
                Играть
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
