"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlayerCharacter } from "@/lib/ai-opponent"

type Props = {
  onSelect: (character: PlayerCharacter) => void
}

export default function CharacterSelect({ onSelect }: Props) {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Выберите свою судьбу</h1>
          <p className="text-muted-foreground">Каждый персонаж имеет уникальную историю и стиль игры</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Hunter Card */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-600/10 group-hover:from-amber-500/20 group-hover:to-orange-600/20 transition-colors" />
            <CardHeader className="relative">
              <div className="flex items-center gap-4">
                <Image
                  src="/images/emoji/hunter-grin.png"
                  alt="Охотник"
                  width={64}
                  height={64}
                  className="rounded-lg"
                />
                <div>
                  <CardTitle className="text-xl">Охотник</CardTitle>
                  <CardDescription>Мастер точности и тактики</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Сюжетная линия:</h4>
                <p className="text-sm text-muted-foreground">
                  Опытный следопыт, защищающий деревню от хитрых уток. Используйте точность, технологии и ловушки для
                  победы.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Особенности:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ограниченные патроны — каждый выстрел на счету</li>
                  <li>• Бинокль для разведки местности</li>
                  <li>• Капканы и технологические улучшения</li>
                  <li>• Развитие через точность и тактику</li>
                </ul>
              </div>

              <Button className="w-full" onClick={() => onSelect("hunter")}>
                Играть за Охотника
              </Button>
            </CardContent>
          </Card>

          {/* Duck Card */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 group-hover:from-emerald-500/20 group-hover:to-teal-600/20 transition-colors" />
            <CardHeader className="relative">
              <div className="flex items-center gap-4">
                <Image src="/images/emoji/duck-sneaky.png" alt="Утка" width={64} height={64} className="rounded-lg" />
                <div>
                  <CardTitle className="text-xl">Утка</CardTitle>
                  <CardDescription>Мастер хитрости и выживания</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Сюжетная линия:</h4>
                <p className="text-sm text-muted-foreground">
                  Умная утка, спасающая свою стаю от охотников. Используйте хитрость, магию природы и мобильность.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Особенности:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Мобильность — перелеты между клетками</li>
                  <li>• Магические способности (дождь, невидимость)</li>
                  <li>• Бронированное оперение для защиты</li>
                  <li>• Развитие через выживание и хитрость</li>
                </ul>
              </div>

              <Button className="w-full" onClick={() => onSelect("duck")}>
                Играть за Утку
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
