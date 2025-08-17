"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Copy, Users, ShoppingCart, X } from "lucide-react"
import { getLobbyState, leaveLobby, selectRole, setPlayerReady } from "@/app/lobby/actions"
import type { Lobby, PlayerRole } from "@/lib/lobby-types"
import Shop from "./shop"

type Props = {
  lobbyId: string
  playerId: string
  onLeaveLobby: () => void
  onStartGame: (playerRole: PlayerRole) => void
  onBackToMenu?: () => void
  preferredRole?: PlayerRole
}

export default function LobbyRoom({
  lobbyId,
  playerId,
  onLeaveLobby,
  onStartGame,
  onBackToMenu,
  preferredRole,
}: Props) {
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [coins, setCoins] = useState(100)
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])
  const [phase, setPhase] = useState<"ready">("ready") // убрал фазу shop, сразу ready
  const [showShop, setShowShop] = useState(false) // добавил состояние для модального магазина

  const loadLobbyState = async () => {
    const result = await getLobbyState(lobbyId)
    if (result.success && result.lobby) {
      setLobby(result.lobby)

      const currentPlayer = result.lobby.players.find((p) => p.id === playerId)
      if (preferredRole && currentPlayer && !currentPlayer.role) {
        await selectRole(lobbyId, playerId, preferredRole)
      }

      if (result.lobby.status === "playing") {
        const player = result.lobby.players.find((p) => p.id === playerId)
        if (player) {
          onStartGame(player.role)
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
  const playerRole = currentPlayer?.role || preferredRole

  return (
    <div className="space-y-6 animate-slide-in">
      {showShop && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-cyan-400" />
                <h2 className="text-3xl font-bold text-white">🛒 Магазин</h2>
              </div>
              <button
                onClick={() => setShowShop(false)}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <Shop
                playerRole={playerRole}
                coins={coins}
                purchasedItems={purchasedItems}
                onPurchase={handlePurchase}
                playerId={playerId}
                onCoinsUpdate={handleCoinsUpdate}
              />
            </div>
          </div>
        </div>
      )}

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

      {playerRole && (
        <div className="game-card border-amber-500/30 bg-gradient-to-r from-amber-900/20 to-yellow-900/20">
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-4xl">{playerRole === "hunter" ? "🏹" : "🦆"}</div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Вы играете за {playerRole === "hunter" ? "Охотника" : "Утку"}
              </h3>
              <p className="text-amber-300">
                {playerRole === "hunter" ? "Найдите и подстрелите утку" : "Избегайте выстрелов охотника"}
              </p>
            </div>
          </div>
        </div>
      )}

      {countdown !== null && (
        <div className="game-card border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20 animate-pulse-glow">
          <div className="text-center py-8">
            <div className="text-8xl font-bold text-green-400 mb-4 animate-bounce">{countdown}</div>
            <div className="text-2xl font-bold text-green-300">🚀 Игра начинается...</div>
          </div>
        </div>
      )}

      {lobby?.status === "waiting" && playerRole && (
        <div className="text-center animate-bounce-in space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => setShowShop(true)}
              className="w-full sm:w-auto px-12 py-6 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:scale-105 transition-all duration-300 shadow-2xl shadow-purple-500/25 border-2 border-purple-400/30"
            >
              <ShoppingCart className="inline-block mr-3 h-8 w-8" />🛒 Магазин
            </button>

            <button
              onClick={handleReadyToggle}
              className={`w-full sm:w-auto px-16 py-6 text-2xl font-bold rounded-2xl transition-all duration-300 border-2 ${
                currentPlayer?.ready
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white animate-pulse-glow shadow-2xl shadow-green-500/25 border-green-400/30"
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:scale-105 shadow-2xl shadow-blue-500/25 border-blue-400/30"
              }`}
            >
              {currentPlayer?.ready ? "✅ Готов! Ожидание соперника..." : "🎯 Готов к игре!"}
            </button>
          </div>

          {!currentPlayer?.ready && (
            <div className="game-card border-amber-500/50 bg-gradient-to-r from-amber-900/20 to-yellow-900/20">
              <div className="text-amber-300 font-bold text-lg mb-2">⚠️ Подтвердите готовность к игре</div>
              <div className="text-amber-400/80">Игра начнется только после того, как оба игрока нажмут "Готов"</div>
            </div>
          )}
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
                  <div className="text-sm text-slate-400">
                    {player.role === "hunter" ? "🏹 Охотник" : player.role === "duck" ? "🦆 Утка" : "⏳ Выбор роли..."}
                  </div>
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
