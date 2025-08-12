"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

  // Показываем позицию утки только игроку-утке или в конце игры
  if (gameState.duckCell >= 0 && (playerCharacter === "duck" || gameState.turn === "ended")) {
    overlays[gameState.duckCell] = { ...overlays[gameState.duckCell], duck: true }
  }

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
      if (gameState.turn === "duck-initial" && playerCharacter === "duck") {
        // Утка выбирает начальную позицию
        setGameState((prev) => ({
          ...prev,
          duckCell: cellIndex,
          turn: "hunter",
        }))
        addNotification("Утка выбрала позицию! Ход охотника.")
      } else if (gameState.turn === "hunter" && playerCharacter === "hunter") {
        // Охотник стреляет
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
          addNotification("🎯 Попадание! Охотник победил!")
        } else if (newShotCells.length >= inv.hunter.shots) {
          addNotification("💥 Патроны закончились! Утка победила!")
        } else {
          addNotification("❌ Промах! Ход утки.")
        }
      } else if (gameState.turn === "duck" && playerCharacter === "duck") {
        // Утка перемещается
        if (!gameState.shotCells.includes(cellIndex) && !gameState.binocularsUsedCells.includes(cellIndex)) {
          setGameState((prev) => ({
            ...prev,
            duckCell: cellIndex,
            turn: "hunter",
          }))
          setBinocularUsedThisTurn(false)
          addNotification("🦆 Утка переместилась! Ход охотника.")
        } else {
          addNotification("❌ Нельзя переместиться в эту клетку!")
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
    ],
  )

  const canClick = useCallback(
    (cellIndex: number) => {
      if (gameState.turn === "duck-initial" && playerCharacter === "duck") {
        return true
      } else if (gameState.turn === "hunter" && playerCharacter === "hunter") {
        return !gameState.shotCells.includes(cellIndex)
      } else if (gameState.turn === "duck" && playerCharacter === "duck") {
        return !gameState.shotCells.includes(cellIndex) && !gameState.binocularsUsedCells.includes(cellIndex)
      }
      return false
    },
    [gameState.turn, gameState.shotCells, gameState.binocularsUsedCells, playerCharacter],
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
      return playerCharacter === "duck" ? "🦆 Ваш ход! Выберите начальную позицию утки" : "⏳ Ожидание хода утки..."
    } else if (gameState.turn === "hunter") {
      return playerCharacter === "hunter" ? "🏹 Ваш ход! Выберите клетку для выстрела" : "⏳ Ожидание хода охотника..."
    } else if (gameState.turn === "duck") {
      return playerCharacter === "duck" ? "🦆 Ваш ход! Переместите утку" : "⏳ Ожидание хода утки..."
    } else {
      return "🎯 Игра окончена"
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {notifications.length > 0 && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4">
          {notifications.map((notification, index) => (
            <div key={index} className="text-blue-800 font-medium">
              {notification}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={onBackToMenu}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад в меню
        </Button>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-3 py-1">
            Раунд {gameState.round}
          </Badge>
          <Badge variant={playerCharacter === "hunter" ? "default" : "secondary"} className="text-lg px-3 py-1">
            {playerCharacter === "hunter" ? "🏹 Охотник" : "🦆 Утка"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Игровое поле</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{playerCharacter === "hunter" ? "Инвентарь охотника" : "Инвентарь утки"}</CardTitle>
          </CardHeader>
          <CardContent>
            {playerCharacter === "hunter" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Патроны:</span>
                  <Badge variant="outline" className="text-lg">
                    {inv.hunter.shots - gameState.shotCells.length}/{inv.hunter.shots}
                  </Badge>
                </div>

                {inv.hunter.binoculars && (
                  <Button
                    variant={!binocularUsedThisTurn ? "secondary" : "outline"}
                    onClick={handleBinocularsWithSound}
                    disabled={gameState.turn !== "hunter" || binocularUsedThisTurn}
                    className="p-3 h-auto"
                  >
                    <Telescope className="mr-2 h-4 w-4" />
                    Бинокль {binocularUsedThisTurn && "(использован)"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Базовый полет:</span>
                  <Badge variant={inv.duck.flight ? "default" : "outline"}>{inv.duck.flight ? "✓" : "✗"}</Badge>
                </div>

                {gameState.duckCell >= 0 && (
                  <div className="flex justify-between items-center p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <span className="font-medium">Позиция:</span>
                    <Badge variant="secondary">Клетка {gameState.duckCell + 1}</Badge>
                  </div>
                )}

                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-sm text-muted-foreground text-center">💡 Избегайте обстрелянных клеток</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Счет матча</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded">
                  <span className="flex items-center gap-2">🏹 Охотник:</span>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {gameState.hunterWins}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 rounded">
                  <span className="flex items-center gap-2">🦆 Утка:</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {gameState.duckWins}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {gameState.gameOver && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-300">🎯 Раунд завершен!</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {gameState.hunterWins > gameState.duckWins ? "🏹 Охотник победил!" : "🦆 Утка победила!"}
                  </div>
                  <Button onClick={handleNewGame} className="w-full" size="lg">
                    🔄 Следующий раунд
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
