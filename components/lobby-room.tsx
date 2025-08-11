"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Users } from "lucide-react"
import Image from "next/image"
import { getLobbyState, leaveLobby, selectRole } from "@/app/lobby/actions"
import type { Lobby, PlayerRole } from "@/lib/lobby-types"

type Props = {
  lobbyId: string
  playerId: string
  onLeaveLobby: () => void
  onStartGame: (playerRole: PlayerRole) => void
}

export default function LobbyRoom({ lobbyId, playerId, onLeaveLobby, onStartGame }: Props) {
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const loadLobbyState = async () => {
    const result = await getLobbyState(lobbyId)
    if (result.success && result.lobby) {
      setLobby(result.lobby)

      // Проверяем статус игры
      if (result.lobby.status === "playing") {
        const currentPlayer = result.lobby.players.find((p) => p.id === playerId)
        if (currentPlayer) {
          onStartGame(currentPlayer.role)
        }
      }
    }
  }

  useEffect(() => {
    loadLobbyState()
    const interval = setInterval(loadLobbyState, 1000) // Обновляем каждую секунду
    return () => clearInterval(interval)
  }, [lobbyId, playerId])

  // Обратный отсчет
  useEffect(() => {
    if (lobby?.status === "countdown" && lobby.countdownStarted) {
      const updateCountdown = () => {
        const elapsed = Date.now() - lobby.countdownStarted!
        const remaining = Math.max(0, 5000 - elapsed)
        setCountdown(Math.ceil(remaining / 1000))

        if (remaining <= 0) {
          setCountdown(null)
        }
      }

      updateCountdown()
      const interval = setInterval(updateCountdown, 100)
      return () => clearInterval(interval)
    } else {
      setCountdown(null)
    }
  }, [lobby?.status, lobby?.countdownStarted])

  const handleLeaveLobby = async () => {
    await leaveLobby(lobbyId, playerId)
    onLeaveLobby()
  }

  const handleSelectRole = async (role: PlayerRole) => {
    await selectRole(lobbyId, playerId, role)
  }

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(lobbyId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!lobby) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="text-center">Загрузка лобби...</div>
      </div>
    )
  }

  const currentPlayer = lobby.players.find((p) => p.id === playerId)
  const otherPlayer = lobby.players.find((p) => p.id !== playerId)

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="outline" onClick={handleLeaveLobby}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Покинуть лобби
          </Button>

          <div className="flex items-center gap-2">
            <div className="font-mono font-bold text-xl">{lobbyId}</div>
            <Button variant="outline" size="sm" onClick={handleCopyCode}>
              <Copy className="h-4 w-4" />
              {copied ? "Скопировано!" : "Копировать"}
            </Button>
          </div>
        </div>

        {/* Обратный отсчет */}
        {countdown !== null && (
          <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="text-center py-8">
              <div className="text-6xl font-bold text-green-600 mb-2">{countdown}</div>
              <div className="text-lg font-medium">Игра начинается...</div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Выбор роли для охотника */}
          <Card
            className={`cursor-pointer transition-all ${
              currentPlayer?.role === "hunter"
                ? "ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950"
                : "hover:shadow-lg"
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/images/emoji/hunter-grin.png" alt="Охотник" width={48} height={48} />
                  <div>
                    <CardTitle>Охотник</CardTitle>
                    <div className="text-sm text-muted-foreground">Мастер точности</div>
                  </div>
                </div>
                {lobby.players.some((p) => p.role === "hunter") && <Badge variant="secondary">Занято</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleSelectRole(currentPlayer?.role === "hunter" ? null : "hunter")}
                disabled={
                  lobby.players.some((p) => p.id !== playerId && p.role === "hunter") || lobby.status !== "waiting"
                }
                className="w-full"
                variant={currentPlayer?.role === "hunter" ? "secondary" : "outline"}
              >
                {currentPlayer?.role === "hunter" ? "Выбрано" : "Выбрать охотника"}
              </Button>
            </CardContent>
          </Card>

          {/* Выбор роли для утки */}
          <Card
            className={`cursor-pointer transition-all ${
              currentPlayer?.role === "duck"
                ? "ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                : "hover:shadow-lg"
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/images/emoji/duck-sneaky.png" alt="Утка" width={48} height={48} />
                  <div>
                    <CardTitle>Утка</CardTitle>
                    <div className="text-sm text-muted-foreground">Мастер хитрости</div>
                  </div>
                </div>
                {lobby.players.some((p) => p.role === "duck") && <Badge variant="secondary">Занято</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleSelectRole(currentPlayer?.role === "duck" ? null : "duck")}
                disabled={
                  lobby.players.some((p) => p.id !== playerId && p.role === "duck") || lobby.status !== "waiting"
                }
                className="w-full"
                variant={currentPlayer?.role === "duck" ? "secondary" : "outline"}
              >
                {currentPlayer?.role === "duck" ? "Выбрано" : "Выбрать утку"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Информация об игроках */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Игроки в лобби ({lobby.players.length}/{lobby.maxPlayers})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lobby.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    player.id === playerId ? "bg-accent/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="font-medium">
                      {player.name}
                      {player.id === playerId && " (Вы)"}
                    </div>
                    {player.role && (
                      <Badge variant={player.role === "hunter" ? "default" : "secondary"}>
                        {player.role === "hunter" ? "Охотник" : "Утка"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {player.ready ? <Badge variant="default">Готов</Badge> : <Badge variant="outline">Не готов</Badge>}
                  </div>
                </div>
              ))}

              {lobby.players.length < lobby.maxPlayers && (
                <div className="flex items-center justify-center p-3 rounded-lg border border-dashed">
                  <div className="text-muted-foreground">Ожидание игрока...</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Статус игры */}
        <div className="mt-6 text-center">
          {lobby.status === "waiting" && (
            <div className="text-muted-foreground">
              {lobby.players.length < 2
                ? "Ожидание второго игрока..."
                : lobby.players.every((p) => p.role && p.ready)
                  ? "Все готовы! Игра скоро начнется..."
                  : "Выберите роли для начала игры"}
            </div>
          )}
          {lobby.status === "countdown" && (
            <div className="text-green-600 font-medium">Игра начинается через {countdown} секунд!</div>
          )}
        </div>
      </div>
    </div>
  )
}
