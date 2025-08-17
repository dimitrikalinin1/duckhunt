"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Target, Feather } from "lucide-react"

export default function RoleSelectPage() {
  const router = useRouter()

  const handleRoleSelect = (role: "hunter" | "duck") => {
    router.push(`/character/${role}`)
  }

  const handleBack = () => {
    router.push("/")
  }

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Hunter Card */}
            <Card
              className="minimal-card hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => handleRoleSelect("hunter")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-8 rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors">
                  <Target className="h-12 w-12 text-orange-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-orange-600">Охотник</CardTitle>
                <p className="text-muted-foreground">Выследи и поймай утку</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Способности:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Стрельба по клеткам</li>
                    <li>• Использование бинокля</li>
                    <li>• Ограниченные патроны</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Цель:</h4>
                  <p className="text-sm text-muted-foreground">
                    Найти и подстрелить утку за ограниченное количество ходов
                  </p>
                </div>
                <Button className="w-full minimal-button" onClick={() => handleRoleSelect("hunter")}>
                  Выбрать охотника
                </Button>
              </CardContent>
            </Card>

            {/* Duck Card */}
            <Card
              className="minimal-card hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => handleRoleSelect("duck")}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-8 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Feather className="h-12 w-12 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-blue-600">Утка</CardTitle>
                <p className="text-muted-foreground">Скрывайся и выживай</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Способности:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Перемещение по полю</li>
                    <li>• Скрытность</li>
                    <li>• Защитные перки</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Цель:</h4>
                  <p className="text-sm text-muted-foreground">Избежать попадания охотника и выжить до конца игры</p>
                </div>
                <Button className="w-full minimal-button" onClick={() => handleRoleSelect("duck")}>
                  Выбрать утку
                </Button>
              </CardContent>
            </Card>
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
