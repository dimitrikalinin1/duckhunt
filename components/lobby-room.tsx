"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Users } from "lucide-react"
import Image from "next/image"
import { getLobbyState, leaveLobby, selectRole } from "@/app/lobby/actions"
import type { Lobby, PlayerRole } from "@/lib/lobby-types"
import Shop from "./shop"

type Props = {
  lobbyId: string
  playerId: string
  onLeaveLobby: () => void
  onStartGame: (playerRole: PlayerRole) => void
  onBackToMenu?: () => void
}

export default function LobbyRoom({ lobbyId, playerId, onLeaveLobby, onStartGame, onBackToMenu }: Props) {
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [coins, setCoins] = useState(100)
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])

  const loadLobbyState = async () => {
    const result = await getLobbyState(lobbyId)
    if (result.success && result.lobby) {
      setLobby(result.lobby)

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
    const interval = setInterval(loadLobbyState, 1000)
    return () => clearInterval(interval)
  }, [lobbyId, playerId])

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
    try {
      const result = await selectRole(lobbyId, playerId, role)

      if (result.success && result.lobby) {
        setLobby(result.lobby)
      } else {
        alert(result.error || "Не удалось выбрать роль")
      }
    } catch (error) {
      console.error("Ошибка при выборе роли:", error)
      alert("Произошла ошибка при выборе роли")
    }
  }

  const handleDeselectRole = async () => {
    try {
      const result = await selectRole(lobbyId, playerId, null)

      if (result.success && result.lobby) {
        setLobby(result.lobby)
      } else {
        alert(result.error || "Не удалось отменить выбор роли")
      }
    } catch (error) {
      console.error("Ошибка при отмене роли:", error)
      alert("Произошла ошибка при отмене роли")
    }
  }

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(lobbyId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePurchase = (itemId: string, price: number) => {
    if (coins >= price && !purchasedItems.includes(itemId)) {
      setPurchasedItems((prev) => [...prev, itemId])
    }
  }

  const handleCoinsUpdate = (newCoins: number) => {
    setCoins(newCoins)
  }

  const handleReadyToggle = async () => {
    try {
      const result = await selectRole(lobbyId, playerId, currentPlayer?.role || null)
      if (result.success && result.lobby) {
        setLobby(result.lobby)
      }
    } catch (error) {
      console.error("Ошибка при изменении готовности:", error)
    }
  }

  if (!lobby) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="text-center">Загрузка лобби...</div>
      </div>
    )
  }

  const currentPlayer = lobby.players.find((p) => p.id === playerId)

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleLeaveLobby}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Покинуть лобби
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="font-mono font-bold text-xl">{lobbyId}</div>
            <Button variant="outline" size="sm" onClick={handleCopyCode}>
              <Copy className="h-4 w-4" />
              {copied ? "Скопировано!" : "Копировать"}
            </Button>
          </div>
        </div>

        {countdown !== null && (
          <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="text-center py-8">
              <div className="text-6xl font-bold text-green-600 mb-2">{countdown}</div>
              <div className="text-lg font-medium">Игра начинается...</div>
            </CardContent>
          </Card>
        )}

        {lobby.status === "waiting" && (
          <div className="mb-6">
            <Shop
              playerRole={currentPlayer?.role || null}
              coins={coins}
              purchasedItems={purchasedItems}
              onPurchase={handlePurchase}
              playerId={playerId}
              onCoinsUpdate={handleCoinsUpdate} // передаем callback для обновления баланса
            />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
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
                onClick={() => {
                  if (currentPlayer?.role === "hunter") {
                    handleDeselectRole()
                  } else {
                    handleSelectRole("hunter")
                  }
                }}
                disabled={
                  lobby.players.some((p) => p.id !== playerId && p.role === "hunter") || lobby.status !== "waiting"
                }
                className="w-full"
                variant={currentPlayer?.role === "hunter" ? "secondary" : "outline"}
              >
                {currentPlayer?.role === "hunter" ? "Отменить выбор" : "Выбрать охотника"}
              </Button>
            </CardContent>
          </Card>

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
                onClick={() => {
                  if (currentPlayer?.role === "duck") {
                    handleDeselectRole()
                  } else {
                    handleSelectRole("duck")
                  }
                }}
                disabled={
                  lobby.players.some((p) => p.id !== playerId && p.role === "duck") || lobby.status !== "waiting"
                }
                className="w-full"
                variant={currentPlayer?.role === "duck" ? "secondary" : "outline"}
              >
                {currentPlayer?.role === "duck" ? "Отменить выбор" : "Выбрать утку"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {currentPlayer?.role && lobby.status === "waiting" && (
          <div className="mb-6 text-center">
            <Button
              onClick={handleReadyToggle}
              size="lg"
              className="px-8 py-3 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
              disabled={!currentPlayer.role}
            >
              ✓ {currentPlayer.ready ? "Готов!" : "Готов к игре!"}
            </Button>
          </div>
        )}

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
