"use client"

import { useState, useCallback, useEffect } from "react"
import { Telescope, ArrowLeft, Volume2, VolumeX } from "lucide-react"
import GameBoard, { type CellOverlay } from "./game-board"
import { useSound } from "use-sound"
import type { PlayerCharacter } from "@/lib/ai-opponent"
import {
  getGameStateAction,
  makeDuckInitialMove,
  makeHunterShot,
  makeDuckMove,
  useBinoculars as useBinocularsAction,
  initializeGame,
} from "@/app/game/actions"

type Props = {
  playerCharacter: PlayerCharacter
  onBackToMenu: () => void
  isMultiplayer?: boolean
  lobbyId?: string | null
  playerId?: string
}

export default function GameSession({
  playerCharacter,
  onBackToMenu,
  isMultiplayer = false,
  lobbyId,
  playerId,
}: Props) {
  const [gameState, setGameState] = useState<any>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastShotAnim, setLastShotAnim] = useState<{ cell: number; id: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const [play] = useSound("/sounds/shot.mp3", { volume: soundEnabled ? 0.5 : 0 })

  const handleCellClick = useCallback(
    async (cellIndex: number) => {
      if (!gameState || !lobbyId || !playerId) return

      const isMyTurn =
        (gameState.turn === "duck-initial" && playerCharacter === "duck") ||
        (gameState.turn === "hunter" && playerCharacter === "hunter") ||
        (gameState.turn === "duck" && playerCharacter === "duck")

      if (!isMyTurn) return

      try {
        let result

        if (gameState.turn === "duck-initial" && playerCharacter === "duck") {
          result = await makeDuckInitialMove(lobbyId, playerId)
        } else if (gameState.turn === "hunter" && playerCharacter === "hunter") {
          if (gameState.shotCells?.includes(cellIndex)) return

          const shotId = Date.now()
          setLastShotAnim({ cell: cellIndex, id: shotId })

          result = await makeHunterShot(lobbyId, playerId, cellIndex)
        } else if (gameState.turn === "duck" && playerCharacter === "duck") {
          if (gameState.shotCells?.includes(cellIndex) || gameState.binocularsUsedCells?.includes(cellIndex)) {
            return
          }

          result = await makeDuckMove(lobbyId, playerId, "flight", cellIndex)
        }

        if (result?.success && result.state) {
          setGameState(result.state)
        }
      } catch (error) {
        console.error("Failed to make move:", error)
      }
    },
    [gameState, playerCharacter, lobbyId, playerId],
  )

  const handleBinoculars = useCallback(async () => {
    if (
      !lobbyId ||
      !playerId ||
      !gameState ||
      gameState.turn !== "hunter" ||
      gameState.binocularUsedThisTurn ||
      !gameState.inventory?.hunter?.binoculars
    ) {
      return
    }

    try {
      const result = await useBinocularsAction(lobbyId, playerId)
      if (result.success && result.state) {
        setGameState(result.state)
      }
    } catch (error) {
      console.error("Failed to use binoculars:", error)
    }
    play()
  }, [lobbyId, playerId, gameState, play])

  useEffect(() => {
    const initGame = async () => {
      if (!lobbyId) return

      try {
        let result = await getGameStateAction(lobbyId)

        if (!result.state) {
          result = await initializeGame(lobbyId)
        }

        if (result.success && result.state) {
          setGameState(result.state)
        }
      } catch (error) {
        console.error("Failed to initialize game:", error)
      } finally {
        setLoading(false)
      }
    }

    initGame()
  }, [lobbyId])

  useEffect(() => {
    if (!lobbyId || !isMultiplayer) return

    const interval = setInterval(async () => {
      try {
        const result = await getGameStateAction(lobbyId)
        if (result.success && result.state) {
          setGameState(result.state)
        }
      } catch (error) {
        console.error("Failed to sync game state:", error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lobbyId, isMultiplayer])

  if (loading || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка игры...</div>
      </div>
    )
  }

  const activeCells = gameState.activeCells || [0, 1, 2, 3, 4, 5, 6, 7, 8]
  const rows = 3
  const cols = 3

  const overlays: Record<number, CellOverlay> = {}
  activeCells.forEach((i: number) => {
    overlays[i] = {}
  })

  gameState.shotCells?.forEach((i: number) => {
    overlays[i] = { ...overlays[i], shot: true }
  })

  gameState.revealedEmptyByBinoculars?.forEach((i: number) => {
    overlays[i] = { ...overlays[i], revealedEmpty: true }
  })

  gameState.binocularsUsedCells?.forEach((i: number) => {
    overlays[i] = { ...overlays[i], binocularsUsed: true }
  })

  if (gameState.duckCell >= 0 && (playerCharacter === "duck" || gameState.turn === "ended")) {
    overlays[gameState.duckCell] = { ...overlays[gameState.duckCell], duck: true }
  }

  const isMyTurn =
    (gameState.turn === "duck-initial" && playerCharacter === "duck") ||
    (gameState.turn === "hunter" && playerCharacter === "hunter") ||
    (gameState.turn === "duck" && playerCharacter === "duck")

  const canClick = useCallback(
    (cellIndex: number) => {
      if (!isMyTurn) return false

      if (gameState.turn === "duck-initial" && playerCharacter === "duck") {
        return activeCells.includes(cellIndex)
      } else if (gameState.turn === "hunter" && playerCharacter === "hunter") {
        return activeCells.includes(cellIndex) && !gameState.shotCells?.includes(cellIndex)
      } else if (gameState.turn === "duck" && playerCharacter === "duck") {
        return (
          activeCells.includes(cellIndex) &&
          !gameState.shotCells?.includes(cellIndex) &&
          !gameState.binocularsUsedCells?.includes(cellIndex)
        )
      }
      return false
    },
    [gameState.turn, gameState.shotCells, gameState.binocularsUsedCells, playerCharacter, isMyTurn, activeCells],
  )

  const getCurrentTurnText = () => {
    if (gameState.turn === "duck-initial") {
      return playerCharacter === "duck" ? "🎯 Ваш ход! Выберите начальную позицию утки" : "⏳ Ожидание хода утки..."
    } else if (gameState.turn === "hunter") {
      return playerCharacter === "hunter" ? "🎯 Ваш ход! Выберите клетку для выстрела" : "⏳ Ожидание хода охотника..."
    } else if (gameState.turn === "duck") {
      return playerCharacter === "duck" ? "🎯 Ваш ход! Переместите утку" : "⏳ Ожидание хода утки..."
    } else {
      return "🏁 Игра окончена"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg fill%3D%22none%22 fillRule%3D%22evenodd%22%3E%3Cg fill%3D%22%239C92AC%22 fillOpacity%3D%220.1%22%3E%3Ccircle cx%3D%2230%22 cy%3D%2230%22 r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBackToMenu} className="game-button-secondary group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Назад в меню
          </button>

          <div className="flex items-center gap-4">
            <div
              className={`px-4 py-2 rounded-xl font-bold ${
                playerCharacter === "hunter"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                  : "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
              }`}
            >
              {playerCharacter === "hunter" ? "🏹 Охотник" : "🦆 Утка"}
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center hover:bg-slate-700/50 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-slate-300" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-300" />
              )}
            </button>
          </div>
        </div>

        <div
          className={`game-card mb-6 text-center transition-all duration-500 ${
            isMyTurn
              ? "border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20 animate-pulse-glow"
              : "border-slate-700 bg-slate-800/30"
          }`}
        >
          <div className={`text-2xl font-bold mb-2 ${isMyTurn ? "text-green-400" : "text-slate-400"}`}>
            {isMyTurn ? "🎯 ВАШ ХОД!" : "⏳ ОЖИДАНИЕ"}
          </div>
          <div className="text-slate-300">{getCurrentTurnText()}</div>
        </div>

        {gameState.notifications && gameState.notifications.length > 0 && (
          <div className="game-card border-blue-500/50 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 mb-6 animate-slide-in">
            {gameState.notifications.map((notification: string, index: number) => (
              <div key={index} className="text-blue-300 font-medium text-lg">
                {notification}
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="game-card">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  🎯 Игровое поле
                </h2>
              </div>
              <div className="max-w-md mx-auto">
                <GameBoard
                  rows={rows}
                  cols={cols}
                  activeCells={activeCells}
                  overlays={overlays}
                  lastShotAnim={lastShotAnim}
                  canClick={canClick}
                  onCellClick={handleCellClick}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="game-card">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    playerCharacter === "hunter"
                      ? "bg-gradient-to-br from-amber-400 to-orange-500"
                      : "bg-gradient-to-br from-emerald-400 to-green-500"
                  }`}
                >
                  {playerCharacter === "hunter" ? "🏹" : "🦆"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Инвентарь</h3>
                  <p className="text-slate-400 text-sm">{playerCharacter === "hunter" ? "Охотника" : "Утки"}</p>
                </div>
              </div>

              {playerCharacter === "hunter" ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-300">💥 Патроны:</span>
                    <div className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg font-bold">
                      {gameState.ammo || 0}
                    </div>
                  </div>

                  {gameState.inventory?.hunter?.binoculars && (
                    <button
                      onClick={handleBinoculars}
                      disabled={gameState.turn !== "hunter" || gameState.binocularUsedThisTurn}
                      className={`w-full p-3 rounded-xl font-bold transition-all ${
                        !gameState.binocularUsedThisTurn && gameState.turn === "hunter"
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:scale-105 shadow-lg shadow-blue-500/25"
                          : "bg-slate-700 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <Telescope className="inline mr-2 h-4 w-4" />🔍 Бинокль{" "}
                      {gameState.binocularUsedThisTurn && "(использован)"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-300">✈️ Базовый полет:</span>
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg font-bold">✓ Активен</div>
                  </div>

                  {gameState.duckCell >= 0 && (
                    <div className="p-3 bg-gradient-to-r from-emerald-900/20 to-green-900/20 rounded-xl border border-emerald-500/30">
                      <div className="text-emerald-300 font-bold">📍 Текущая позиция:</div>
                      <div className="text-emerald-400 text-lg">Клетка {gameState.duckCell + 1}</div>
                    </div>
                  )}

                  <div className="p-3 bg-blue-900/20 rounded-xl border border-blue-500/30">
                    <div className="text-blue-300 text-sm text-center">
                      💡 Избегайте обстрелянных клеток и мест где использовался бинокль
                    </div>
                  </div>
                </div>
              )}
            </div>

            {gameState.outcome && (
              <div className="game-card border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20 animate-pulse-glow">
                <div className="text-center space-y-4">
                  <div className="text-6xl animate-bounce">🎯</div>
                  <div className="text-2xl font-bold text-green-400">
                    {gameState.outcome.winner === "hunter" ? "🏹 Охотник победил!" : "🦆 Утка победила!"}
                  </div>
                  <div className="text-slate-300">
                    {gameState.outcome.reason === "hunter-shot-duck" && "Охотник подстрелил утку!"}
                    {gameState.outcome.reason === "hunter-out-of-ammo" && "У охотника закончились патроны!"}
                    {gameState.outcome.reason === "duck-hit-beaver" && "Утка попала на бобра!"}
                    {gameState.outcome.reason === "duck-hit-warden" && "Утка попала на смотрителя!"}
                    {gameState.outcome.reason === "hunter-hit-beaver" && "Охотник подстрелил бобра!"}
                    {gameState.outcome.reason === "hunter-hit-warden" && "Охотник подстрелил смотрителя!"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
