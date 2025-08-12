"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Copy, Users } from "lucide-react"
import { getLobbyState, leaveLobby, selectRole, setPlayerReady } from "@/app/lobby/actions"
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
  const [phase, setPhase] = useState<"role" | "shop" | "ready">("role")

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
        if (role) {
          setPhase("shop")
        }
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
        setPhase("role")
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
      console.log("Переключение готовности для игрока:", playerId)
      const result = await setPlayerReady(lobbyId, playerId, !currentPlayer?.ready)
      if (result.success && result.lobby) {
        console.log("Обновленное лобби:", result.lobby)
        setLobby(result.lobby)
      } else {
        alert(result.error || "Не удалось изменить готовность")
      }
    } catch (error) {
      console.error("Ошибка при изменении готовности:", error)
    }
  }

  const handleShopComplete = () => {
    setPhase("ready")
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
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <button onClick={handleLeaveLobby} className="game-button-secondary group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Покинуть лобби
        </button>

        <div className="flex items-center gap-3">
          <div className="font-mono font-bold text-2xl text-cyan-400 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
            {lobbyId}
          </div>
          <button onClick={handleCopyCode} className="game-button-secondary">
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "✅" : "📋"}
          </button>
        </div>
      </div>

      {countdown !== null && (
        <div className="game-card border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20 animate-pulse-glow">
          <div className="text-center py-8">
            <div className="text-8xl font-bold text-green-400 mb-4 animate-bounce">{countdown}</div>
            <div className="text-2xl font-bold text-green-300">🚀 Игра начинается...</div>
          </div>
        </div>
      )}

      {phase === "role" && lobby?.status === "waiting" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div
            className={`game-card group cursor-pointer transition-all duration-300 ${
              currentPlayer?.role === "hunter"
                ? "ring-2 ring-amber-400 bg-gradient-to-br from-amber-900/20 to-orange-900/20 animate-pulse-glow"
                : "hover:scale-105"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl animate-float">
                  🏹
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Охотник</h3>
                  <p className="text-slate-400">Мастер точности</p>
                </div>
              </div>
              {lobby.players.some((p) => p.role === "hunter") && (
                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30">
                  Занято
                </span>
              )}
            </div>
            <button
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
              className={`w-full ${currentPlayer?.role === "hunter" ? "game-button-secondary" : "game-button-primary"}`}
            >
              {currentPlayer?.role === "hunter" ? "❌ Отменить выбор" : "🎯 Выбрать охотника"}
            </button>
          </div>

          <div
            className={`game-card group cursor-pointer transition-all duration-300 ${
              currentPlayer?.role === "duck"
                ? "ring-2 ring-emerald-400 bg-gradient-to-br from-emerald-900/20 to-green-900/20 animate-pulse-glow"
                : "hover:scale-105"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-2xl animate-float">
                  🦆
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Утка</h3>
                  <p className="text-slate-400">Мастер хитрости</p>
                </div>
              </div>
              {lobby.players.some((p) => p.role === "duck") && (
                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30">
                  Занято
                </span>
              )}
            </div>
            <button
              onClick={() => {
                if (currentPlayer?.role === "duck") {
                  handleDeselectRole()
                } else {
                  handleSelectRole("duck")
                }
              }}
              disabled={lobby.players.some((p) => p.id !== playerId && p.role === "duck") || lobby.status !== "waiting"}
              className={`w-full ${currentPlayer?.role === "duck" ? "game-button-secondary" : "game-button-primary"}`}
            >
              {currentPlayer?.role === "duck" ? "❌ Отменить выбор" : "🦆 Выбрать утку"}
            </button>
          </div>
        </div>
      )}

      {phase === "shop" && currentPlayer?.role && lobby?.status === "waiting" && (
        <div className="animate-slide-in">
          <Shop
            playerRole={currentPlayer.role}
            coins={coins}
            purchasedItems={purchasedItems}
            onPurchase={handlePurchase}
            playerId={playerId}
            onCoinsUpdate={handleCoinsUpdate}
          />
          <div className="text-center mt-6">
            <button onClick={handleShopComplete} className="game-button-primary px-8 py-3 text-xl">
              🛒 Завершить покупки
            </button>
          </div>
        </div>
      )}

      {phase === "ready" && currentPlayer?.role && lobby?.status === "waiting" && (
        <div className="text-center animate-bounce-in">
          <div className="game-card border-amber-500/50 bg-gradient-to-r from-amber-900/20 to-yellow-900/20 mb-6">
            <div className="text-amber-300 font-bold text-lg mb-2">⚠️ Подтвердите готовность к игре</div>
            <div className="text-amber-400/80">Игра начнется только после того, как оба игрока нажмут "Готов"</div>
          </div>
          <button
            onClick={handleReadyToggle}
            className={`px-12 py-4 text-2xl font-bold rounded-2xl transition-all duration-300 ${
              currentPlayer.ready
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse-glow shadow-lg shadow-green-500/25"
                : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:scale-105 shadow-lg shadow-blue-500/25"
            }`}
            disabled={!currentPlayer.role}
          >
            {currentPlayer.ready ? "✅ Готов! Ожидание соперника..." : "🎯 Готов к игре!"}
          </button>
        </div>
      )}

      <div className="game-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Игроки в лобби</h3>
            <p className="text-slate-400">
              {lobby.players.length}/{lobby.maxPlayers} участников
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {lobby.players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                player.id === playerId
                  ? "bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-cyan-500/30"
                  : "bg-slate-800/30 border-slate-700"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white">
                    {player.name}
                    {player.id === playerId && " (Вы)"}
                  </div>
                  {player.role && (
                    <div className="text-sm text-slate-400">{player.role === "hunter" ? "🏹 Охотник" : "🦆 Утка"}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {player.ready ? (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm border border-green-500/30 animate-pulse-glow">
                    ✅ Готов
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-slate-700 text-slate-400 rounded-lg text-sm">⏳ Не готов</span>
                )}
              </div>
            </div>
          ))}
          {lobby.players.length < lobby.maxPlayers && (
            <div className="flex items-center justify-center p-4 rounded-xl border border-dashed border-slate-600 bg-slate-800/20">
              <div className="text-slate-400 animate-pulse">⏳ Ожидание игрока...</div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        {lobby?.status === "waiting" && (
          <div className="text-slate-300 text-lg">
            {lobby.players.length < 2
              ? "⏳ Ожидание второго игрока..."
              : phase === "role"
                ? "🎭 Выберите роли для продолжения"
                : phase === "shop"
                  ? "🛒 Совершите покупки в магазине"
                  : !lobby.players.every((p) => p.ready)
                    ? "⚡ Нажмите 'Готов' для начала игры"
                    : "🚀 Все готовы! Запуск игры..."}
          </div>
        )}
        {lobby?.status === "countdown" && (
          <div className="text-green-400 font-bold text-2xl animate-pulse">
            🎯 Игра начинается через {countdown} секунд!
          </div>
        )}
      </div>
    </div>
  )
}
