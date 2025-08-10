"use client"

import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useMemo, useState } from "react"
import { backgrounds, emojis, icons, type Asset } from "@/lib/asset-catalog"
import { Badge } from "@/components/ui/badge"

export default function AssetsPage() {
  const [q, setQ] = useState("")
  const qn = q.trim().toLowerCase()

  const filtered = (items: Asset[]) =>
    items.filter((a) => a.name.toLowerCase().includes(qn) || a.desc?.toLowerCase().includes(qn))

  const bg = useMemo(() => filtered(backgrounds), [qn])
  const em = useMemo(() => filtered(emojis), [qn])
  const ic = useMemo(() => filtered(icons), [qn])

  return (
    <main className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Пакет ассетов: фоны, эмодзи и иконки</h1>
          <p className="text-muted-foreground">
            Готовый набор для прототипа. Нажмите на изображение, чтобы открыть оригинал и скачать.
          </p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск: duck, beaver, bank..."
          className="w-full md:w-80"
        />
      </div>

      <Tabs defaultValue="backgrounds">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="backgrounds">Фоны ({bg.length})</TabsTrigger>
          <TabsTrigger value="emojis">Эмодзи ({em.length})</TabsTrigger>
          <TabsTrigger value="icons">Иконки UI ({ic.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="backgrounds" className="mt-4">
          <Grid items={bg} imgClass="h-28 sm:h-40 md:h-48 object-cover" />
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle>Рекомендации по фонам</CardTitle>
              <CardDescription>16:9, используйте cover; добавляйте слой камышей для глубины.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="emojis" className="mt-4">
          <Grid items={em} imgClass="h-16 w-16 object-contain" />
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle>Рекомендации по эмодзи</CardTitle>
              <CardDescription>
                Размер 64–128px, прозрачный фон. Подходит для всплывающих реакций и логов.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="icons" className="mt-4">
          <Grid items={ic} imgClass="h-12 w-12 object-contain" />
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle>Рекомендации по иконкам</CardTitle>
              <CardDescription>Размер 24–48px. Сохраняйте контраст на светлой и темной теме.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Использование в коде</CardTitle>
          <CardDescription>Импортируйте путь или подставляйте его в Image/src.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">{`import Image from "next/image"

// Пример: иконка банка
<Image src="/images/ui/bank.png" alt="Банк игры" width={32} height={32} />

// Пример: фон уровня
<div className="relative">
  <Image src="/images/backgrounds/forest-edge.png" alt="Лесная опушка" fill className="object-cover" />
</div>`}</pre>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <span className="mr-2">Навигация:</span>
        <a className="underline" href="/">
          На главную
        </a>
      </div>
    </main>
  )
}

function Grid({ items, imgClass }: { items: Asset[]; imgClass?: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map((a) => (
        <a key={a.path} href={a.path} target="_blank" rel="noreferrer" className="group">
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="relative flex items-center justify-center">
                <Image
                  src={a.path || "/placeholder.svg"}
                  alt={`${a.name}${a.desc ? " — " + a.desc : ""}`}
                  width={240}
                  height={160}
                  className={imgClass ?? "h-20 object-contain"}
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-sm font-medium truncate">{a.name}</div>
                {a.desc && (
                  <Badge variant="outline" className="truncate max-w-[8rem]">
                    {a.desc}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">{a.path}</div>
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  )
}
