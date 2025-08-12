"use client"

import { useState, useCallback } from "react"
import { Telescope, ArrowLeft, Volume2, VolumeX } from "lucide-react"
import GameBoard, { type CellOverlay } from "./game-board"
import { useSound } from "use-sound"
import type { PlayerCharacter } from "@/lib/ai-opponent"

type Props = {
  playerCharacter: PlayerCharacter
  onBackToMenu: () => void
  isMultiplayer?: boolean
  lobbyId?: string | null
  playerId?: string
}

export default function GameSession({ playerCharacter, onBackToMenu, isMultiplayer = false }: Props) {
  const [gameState, setGameState] = useState({
    turn: "duck-initial" as "duck-initial" | "hunter" | "duck" | "ended",
    duckCell: -1,
    shotCells: [] as number[],
    revealedEmptyByBinoculars: [] as number[],
    binocularsUsedCells: [] as number[],
    round: 1,
    hunterWins: 0,
    duckWins: 0,
    gameOver: false,
  })

  const [inv, setInv] = useState({
    hunter: { shots: 3, binoculars: true },
    duck: { flight: true },
  })

  const [binocularUsedThisTurn, setBinocularUsedThisTurn] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notifications, setNotifications] = useState<string[]>([])
  const [lastShotAnim, setLastShotAnim] = useState<{ cell: number; id: number } | null>(null)

  const [play] = useSound("/sounds/shot.mp3", { volume: soundEnabled ? 0.5 : 0 })

  const activeCells = [0, 1, 2, 3, 4, 5, 6, 7, 8] // 3x3 grid
  const rows = 3
  const cols = 3

  const overlays: Record<number, CellOverlay> = {}

  activeCells.forEach((i) => {
    overlays[i] = {}
  })

  gameState.shotCells.forEach((i) => {
    overlays[i] = { ...overlays[i], shot: true }
  })

  gameState.revealedEmptyByBinoculars.forEach((i) => {
    overlays[i] = { ...overlays[i], revealedEmpty: true }
  })

  gameState.binocularsUsedCells.forEach((i) => {
    overlays[i] = { ...overlays[i], binocularsUsed: true }
  })

  if (gameState.duckCell >= 0 && (playerCharacter === "duck" || gameState.turn === "ended")) {
    overlays[gameState.duckCell] = { ...overlays[gameState.duckCell], duck: true }
  }

  const [isMyTurn, setIsMyTurn] = useState(() => {
    return gameState.turn === "duck-initial" && playerCharacter === "duck"
  })

  const updateTurnState = useCallback(() => {
    const newIsMyTurn =
      (gameState.turn === "duck-initial" && playerCharacter === "duck") ||
      (gameState.turn === "hunter" && playerCharacter === "hunter") ||
      (gameState.turn === "duck" && playerCharacter === "duck")

    setIsMyTurn(newIsMyTurn)
  }, [gameState.turn, playerCharacter])

  const handleBinoculars = useCallback(() => {
    if (gameState.turn !== "hunter" || binocularUsedThisTurn || !inv.hunter.binoculars) {
      return
    }

    const emptyCells = activeCells.filter((i) => i !== gameState.duckCell && !gameState.shotCells.includes(i))

    if (emptyCells.length > 0) {
      const revealedCells = emptyCells.slice(0, 2)

      setGameState((prev) => ({
        ...prev,
        revealedEmptyByBinoculars: [...prev.revealedEmptyByBinoculars, ...revealedCells],
        binocularsUsedCells: [...prev.binocularsUsedCells, ...revealedCells],
      }))

      setBinocularUsedThisTurn(true)
      addNotification("Бинокль показал пустые клетки!")
    }
  }, [
    gameState.turn,
    binocularUsedThisTurn,
    inv.hunter.binoculars,
    gameState.duckCell,
    gameState.shotCells,
    activeCells,
  ])

  const handleBinocularsWithSound = useCallback(() => {
    handleBinoculars()
    if (soundEnabled) {
      play()
    }
  }, [handleBinoculars, play, soundEnabled])

  const handleCellClick = useCallback(
    (cellIndex: number) => {
      if (!isMyTurn) {
        addNotification("Сейчас не ваш ход!")
        return
      }

      if (gameState.turn === "duck-initial" && playerCharacter === "duck") {
        setGameState((prev) => ({
          ...prev,
          duckCell: cellIndex,
          turn: "hunter",
        }))
        addNotification("Утка выбрала позицию! Ход переходит к охотнику.")

        setTimeout(() => updateTurnState(), 100)
      } else if (gameState.turn === "hunter" && playerCharacter === "hunter") {
        const shotId = Date.now()
        setLastShotAnim({ cell: cellIndex, id: shotId })

        const newShotCells = [...gameState.shotCells, cellIndex]
        const hit = cellIndex === gameState.duckCell

        setGameState((prev) => ({
          ...prev,
          shotCells: newShotCells,
          turn: hit ? "ended" : "duck",
          hunterWins: hit ? prev.hunterWins + 1 : prev.hunterWins,
          duckWins: hit ? prev.duckWins : newShotCells.length >= inv.hunter.shots ? prev.duckWins + 1 : prev.duckWins,
          gameOver: hit || newShotCells.length >= inv.hunter.shots,
        }))

        if (soundEnabled) {
          play()
        }

        if (hit) {
          addNotification("Попадание! Охотник победил!")
        } else if (newShotCells.length >= inv.hunter.shots) {
          addNotification("Патроны закончились! Утка победила!")
        } else {
          addNotification("Промах! Ход переходит к утке.")
        }

        setTimeout(() => updateTurnState(), 100)
      } else if (gameState.turn === "duck" && playerCharacter === "duck") {
        if (!gameState.shotCells.includes(cellIndex) && !gameState.binocularsUsedCells.includes(cellIndex)) {
          setGameState((prev) => ({
            ...prev,
            duckCell: cellIndex,
            turn: "hunter",
          }))
          setBinocularUsedThisTurn(false)
          addNotification("Утка переместилась! Ход переходит к охотнику.")

          setTimeout(() => updateTurnState(), 100)
        } else {
          addNotification("Нельзя переместиться в эту клетку!")
        }
      }
    },
    [
      gameState.turn,
      gameState.duckCell,
      gameState.shotCells,
      gameState.binocularsUsedCells,
      playerCharacter,
      inv.hunter.shots,
      play,
      soundEnabled,
      isMyTurn,
      updateTurnState,
    ],
  )

  const canClick = useCallback(
    (cellIndex: number) => {
      if (!isMyTurn) return false

      if (gameState.turn === "duck-initial" && playerCharacter === "duck") {
        return true
      } else if (gameState.turn === "hunter" && playerCharacter === "hunter") {
        return !gameState.shotCells.includes(cellIndex)
      } else if (gameState.turn === "duck" && playerCharacter === "duck") {
        return !gameState.shotCells.includes(cellIndex) && !gameState.binocularsUsedCells.includes(cellIndex)
      }
      return false
    },
    [gameState.turn, gameState.shotCells, gameState.binocularsUsedCells, playerCharacter, isMyTurn],
  )

  const addNotification = (message: string) => {
    setNotifications((prev) => [...prev, message])
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1))
    }, 3000)
  }

  const handleNewGame = () => {
    setGameState({
      turn: "duck-initial",
      duckCell: -1,
      shotCells: [],
      revealedEmptyByBinoculars: [],
      binocularsUsedCells: [],
      round: gameState.round + 1,
      hunterWins: gameState.hunterWins,
      duckWins: gameState.duckWins,
      gameOver: false,
    })
    setBinocularUsedThisTurn(false)
    setNotifications([])
  }

  const getCurrentTurnText = () => {
    if (gameState.turn === "duck-initial") {
      return playerCharacter === "duck" ? "Ваш ход! Выберите начальную позицию утки" : "Ожидание хода утки..."
    } else if (gameState.turn === "hunter") {
      return playerCharacter === "hunter" ? "Ваш ход! Выберите клетку для выстрела" : "Ожидание хода охотника..."
    } else if (gameState.turn === "duck") {
      return playerCharacter === "duck" ? "Ваш ход! Переместите утку" : "Ожидание хода утки..."
    } else {
      return "Игра окончена"
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
            <div className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300">
              Раунд {gameState.round}
            </div>
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

        {notifications.length > 0 && (
          <div className="game-card border-blue-500/50 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 mb-6 animate-slide-in">
            {notifications.map((notification, index) => (
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
                      {inv.hunter.shots - gameState.shotCells.length}/{inv.hunter.shots}
                    </div>
                  </div>

                  {inv.hunter.binoculars && (
                    <button
                      onClick={handleBinocularsWithSound}
                      disabled={gameState.turn !== "hunter" || binocularUsedThisTurn}
                      className={`w-full p-3 rounded-xl font-bold transition-all ${
                        !binocularUsedThisTurn && gameState.turn === "hunter"
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:scale-105 shadow-lg shadow-blue-500/25"
                          : "bg-slate-700 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <Telescope className="inline mr-2 h-4 w-4" />🔍 Бинокль {binocularUsedThisTurn && "(использован)"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-300">✈️ Базовый полет:</span>
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg font-bold">
                      {inv.duck.flight ? "✓ Активен" : "✗ Недоступен"}
                    </div>
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

            <div className="game-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-2xl">
                  🏆
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Счет матча</h3>
                  <p className="text-slate-400 text-sm">Победы в раундах</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-amber-900/20 rounded-xl border border-amber-500/30">
                  <span className="text-amber-300 font-bold">🏹 Охотник</span>
                  <div className="text-2xl font-bold text-amber-400">{gameState.hunterWins}</div>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-900/20 rounded-xl border border-emerald-500/30">
                  <span className="text-emerald-300 font-bold">🦆 Утка</span>
                  <div className="text-2xl font-bold text-emerald-400">{gameState.duckWins}</div>
                </div>
              </div>
            </div>

            {gameState.gameOver && (
              <div className="game-card border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20 animate-pulse-glow">
                <div className="text-center space-y-4">
                  <div className="text-6xl animate-bounce">🎯</div>
                  <div className="text-2xl font-bold text-green-400">
                    {gameState.hunterWins > gameState.duckWins ? "🏹 Охотник победил!" : "🦆 Утка победила!"}
                  </div>
                  <button onClick={handleNewGame} className="game-button-primary w-full">
                    🔄 Следующий раунд
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
