"use client"

import { useState, useCallback, useEffect } from "react"
import { Telescope, ArrowLeft, Volume2, VolumeX, X } from "lucide-react"
import GameBoard, { type CellOverlay } from "./game-board"
import { useSound } from "use-sound"
import type { PlayerCharacter } from "@/lib/ai-opponent"
import {
  getGameStateAction,
  makeDuckInitialMove,
  makeHunterShot,
  makeDuckMove,
  useBinoculars as binocularsAction,
  initializeGame,
} from "@/app/game/actions"

type Props = {
  playerCharacter: PlayerCharacter
  onBackToMenu: () => void
  isMultiplayer?: boolean
  lobbyId?: string | null
  playerId?: string
}

function GameResultModal({
  outcome,
  lastAction,
  playerCharacter,
  onClose,
  onBackToMenu,
  onChangeRole,
}: {
  outcome: any
  lastAction: any
  playerCharacter: PlayerCharacter
  onClose: () => void
  onBackToMenu: () => void
  onChangeRole: () => void
}) {
  if (!outcome) return null

  const isWinner =
    (outcome.winner === "hunter" && playerCharacter === "hunter") ||
    (outcome.winner === "duck" && playerCharacter === "duck")

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full text-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
        >
          <X className="h-3 w-3" />
        </button>

        <div className={`text-2xl font-bold mb-3 ${isWinner ? "text-primary" : "text-destructive"}`}>
          {isWinner ? "Победа" : "Поражение"}
        </div>

        <div className="text-muted-foreground mb-4">
          {outcome.winner === "hunter" ? "Охотник победил" : "Утка победила"}
        </div>

        <div className="text-sm text-card-foreground mb-4">
          {outcome.reason === "hunter-shot-duck" && "Охотник подстрелил утку"}
          {outcome.reason === "hunter-out-of-ammo" && "У охотника закончились патроны"}
          {outcome.reason === "duck-hit-beaver" && "Утка попала на бобра"}
          {outcome.reason === "duck-hit-warden" && "Утка попала на смотрителя"}
          {outcome.reason === "hunter-hit-beaver" && "Охотник подстрелил бобра"}
          {outcome.reason === "hunter-hit-warden" && "Охотник подстрелил смотрителя"}
        </div>

        {lastAction?.type === "game-ended" && (
          <div className="mb-4 p-3 bg-muted rounded-md">
            <div className="text-sm font-medium mb-1">Изменение баланса:</div>
            <div className="text-lg font-bold">
              {playerCharacter === "hunter"
                ? (lastAction.data.hunterGoldChange >= 0 ? "+" : "") + lastAction.data.hunterGoldChange
                : (lastAction.data.duckGoldChange >= 0 ? "+" : "") + lastAction.data.duckGoldChange}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm"
            >
              Продолжить
            </button>
            <button
              onClick={onBackToMenu}
              className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              В меню
            </button>
          </div>
          <button
            onClick={onChangeRole}
            className="w-full px-3 py-2 bg-muted text-muted-foreground rounded-md text-sm border border-border"
          >
            Сменить роль
          </button>
        </div>
      </div>
    </div>
  )
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
  const [error, setError] = useState<string | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)

  const [play] = useSound("/sounds/shot.mp3", { volume: soundEnabled ? 0.5 : 0 })

  useEffect(() => {
    if (gameState?.outcome && !showResultModal) {
      setShowResultModal(true)
    }
  }, [gameState?.outcome, showResultModal])

  const handleCellClick = useCallback(
    async (cellIndex: number) => {
      if (!gameState || !lobbyId || !playerId || loading || error) {
        console.warn("Cannot make move: invalid state", { gameState: !!gameState, lobbyId, playerId, loading, error })
        return
      }

      const isMyTurn =
        (gameState.turn === "duck-initial" && playerCharacter === "duck") ||
        (gameState.turn === "hunter" && playerCharacter === "hunter") ||
        (gameState.turn === "duck" && playerCharacter === "duck")

      if (!isMyTurn) {
        console.warn("Not my turn", { currentTurn: gameState.turn, playerCharacter })
        return
      }

      try {
        setError(null)
        let result

        if (gameState.turn === "duck-initial" && playerCharacter === "duck") {
          result = await makeDuckInitialMove(lobbyId, playerId, cellIndex)
        } else if (gameState.turn === "hunter" && playerCharacter === "hunter") {
          if (gameState.shotCells?.includes(cellIndex)) {
            console.warn("Cell already shot", cellIndex)
            return
          }

          const shotId = Date.now()
          setLastShotAnim({ cell: cellIndex, id: shotId })

          result = await makeHunterShot(lobbyId, playerId, cellIndex)
        } else if (gameState.turn === "duck" && playerCharacter === "duck") {
          if (gameState.shotCells?.includes(cellIndex) || gameState.binocularsUsedCells?.includes(cellIndex)) {
            console.warn("Invalid duck move to cell", cellIndex)
            return
          }

          result = await makeDuckMove(lobbyId, playerId, "flight", cellIndex)
        }

        if (result?.success && result.state) {
          setGameState(result.state)
        } else if (result?.error) {
          setError(`Ошибка хода: ${result.error}`)
        }
      } catch (error) {
        console.error("Failed to make move:", error)
        setError("Не удалось сделать ход. Попробуйте еще раз.")
      }
    },
    [gameState, playerCharacter, lobbyId, playerId, loading, error],
  )

  const handleBinoculars = useCallback(async () => {
    if (
      !lobbyId ||
      !playerId ||
      !gameState ||
      loading ||
      error ||
      gameState.turn !== "hunter" ||
      gameState.binocularUsedThisTurn ||
      !gameState.inventory?.hunter?.binoculars
    ) {
      return
    }

    try {
      setError(null)
      const result = await binocularsAction(lobbyId, playerId)
      if (result.success && result.state) {
        setGameState(result.state)
      } else if (result.error) {
        setError(`Ошибка использования бинокля: ${result.error}`)
      }
    } catch (error) {
      console.error("Failed to use binoculars:", error)
      setError("Не удалось использовать бинокль. Попробуйте еще раз.")
    }

    play()
  }, [lobbyId, playerId, gameState, loading, error, play])

  useEffect(() => {
    const initGame = async () => {
      if (!lobbyId) {
        setError("Отсутствует ID лобби")
        setLoading(false)
        return
      }

      try {
        setError(null)
        let result = await getGameStateAction(lobbyId)

        if (!result.state) {
          console.log("Initializing new game...")
          result = await initializeGame(lobbyId)
        }

        if (result.success && result.state) {
          setGameState(result.state)
        } else if (result.error) {
          setError(`Ошибка инициализации игры: ${result.error}`)
        } else {
          setError("Не удалось загрузить состояние игры")
        }
      } catch (error) {
        console.error("Failed to initialize game:", error)
        setError("Ошибка при загрузке игры. Попробуйте перезагрузить страницу.")
      } finally {
        setLoading(false)
      }
    }

    initGame()
  }, [lobbyId])

  useEffect(() => {
    if (!lobbyId || !isMultiplayer || loading || error) return

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
  }, [lobbyId, isMultiplayer, loading, error])

  const canClick = useCallback(
    (cellIndex: number) => {
      if (!gameState) return false

      const isMyTurn =
        (gameState.turn === "duck-initial" && playerCharacter === "duck") ||
        (gameState.turn === "hunter" && playerCharacter === "hunter") ||
        (gameState.turn === "duck" && playerCharacter === "duck")

      if (!isMyTurn) return false

      if (gameState.turn === "duck-initial" && playerCharacter === "duck") {
        return Array.isArray(gameState.activeCells) && gameState.activeCells.includes(cellIndex)
      } else if (gameState.turn === "hunter" && playerCharacter === "hunter") {
        return (
          Array.isArray(gameState.activeCells) &&
          gameState.activeCells.includes(cellIndex) &&
          !gameState.shotCells?.includes(cellIndex)
        )
      } else if (gameState.turn === "duck" && playerCharacter === "duck") {
        return (
          Array.isArray(gameState.activeCells) &&
          gameState.activeCells.includes(cellIndex) &&
          !gameState.shotCells?.includes(cellIndex) &&
          !gameState.binocularsUsedCells?.includes(cellIndex)
        )
      }
      return false
    },
    [gameState, playerCharacter],
  )

  const handleChangeRole = () => {
    window.location.href = "/role-select"
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-destructive rounded-lg p-6 max-w-md text-center">
          <div className="text-2xl font-bold text-destructive mb-4">Ошибка игры</div>
          <div className="text-card-foreground mb-6">{error}</div>
          <button onClick={onBackToMenu} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Вернуться в меню
          </button>
        </div>
      </div>
    )
  }

  if (loading || !gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground text-sm">Загрузка игры...</p>
        </div>
      </div>
    )
  }

  const activeCells = Array.isArray(gameState.activeCells) ? gameState.activeCells : [0, 1, 2, 3, 4, 5, 6, 7, 8]
  const rows = 3
  const cols = 3

  const overlays: Record<number, CellOverlay> = {}
  activeCells.forEach((i: number) => {
    if (typeof i === "number" && i >= 0 && i < 9) {
      overlays[i] = {}
    }
  })

  if (Array.isArray(gameState.shotCells)) {
    gameState.shotCells.forEach((i: number) => {
      if (typeof i === "number" && overlays[i]) {
        overlays[i] = { ...overlays[i], shot: true }
      }
    })
  }

  if (Array.isArray(gameState.revealedEmptyByBinoculars)) {
    gameState.revealedEmptyByBinoculars.forEach((i: number) => {
      if (typeof i === "number" && overlays[i]) {
        overlays[i] = { ...overlays[i], revealedEmpty: true }
      }
    })
  }

  if (Array.isArray(gameState.binocularsUsedCells)) {
    gameState.binocularsUsedCells.forEach((i: number) => {
      if (typeof i === "number" && overlays[i]) {
        overlays[i] = { ...overlays[i], binocularsUsed: true }
      }
    })
  }

  if (Array.isArray(gameState.beaverCells)) {
    gameState.beaverCells.forEach((i: number) => {
      if (typeof i === "number" && overlays[i]) {
        overlays[i] = { ...overlays[i], beaver: true }
      }
    })
  }

  if (Array.isArray(gameState.wardenCells)) {
    gameState.wardenCells.forEach((i: number) => {
      if (typeof i === "number" && overlays[i]) {
        overlays[i] = { ...overlays[i], warden: true }
      }
    })
  }

  if (gameState.outcome && gameState.outcome.reason === "duck-hit-beaver" && typeof gameState.beaverCell === "number") {
    if (overlays[gameState.beaverCell]) {
      overlays[gameState.beaverCell] = { ...overlays[gameState.beaverCell], beaver: true }
    }
  }

  if (
    gameState.outcome &&
    gameState.outcome.reason === "hunter-hit-beaver" &&
    typeof gameState.beaverCell === "number"
  ) {
    if (overlays[gameState.beaverCell]) {
      overlays[gameState.beaverCell] = { ...overlays[gameState.beaverCell], beaver: true }
    }
  }

  if (gameState.outcome && gameState.outcome.reason === "duck-hit-warden" && typeof gameState.wardenCell === "number") {
    if (overlays[gameState.wardenCell]) {
      overlays[gameState.wardenCell] = { ...overlays[gameState.wardenCell], warden: true }
    }
  }

  if (
    gameState.outcome &&
    gameState.outcome.reason === "hunter-hit-warden" &&
    typeof gameState.wardenCell === "number"
  ) {
    if (overlays[gameState.wardenCell]) {
      overlays[gameState.wardenCell] = { ...overlays[gameState.wardenCell], warden: true }
    }
  }

  if (
    typeof gameState.duckCell === "number" &&
    gameState.duckCell >= 0 &&
    (playerCharacter === "duck" || gameState.turn === "ended")
  ) {
    if (overlays[gameState.duckCell]) {
      overlays[gameState.duckCell] = { ...overlays[gameState.duckCell], duck: true }
    }
  }

  const getCurrentTurnText = () => {
    if (gameState.turn === "duck-initial") {
      return playerCharacter === "duck" ? "Ваш ход - выберите позицию" : "Ожидание хода утки"
    } else if (gameState.turn === "hunter") {
      return playerCharacter === "hunter" ? "Ваш ход - выберите цель" : "Ожидание хода охотника"
    } else if (gameState.turn === "duck") {
      return playerCharacter === "duck" ? "Ваш ход - переместитесь" : "Ожидание хода утки"
    } else {
      return "Игра окончена"
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {showResultModal && gameState?.outcome && (
        <GameResultModal
          outcome={gameState.outcome}
          lastAction={gameState.lastAction}
          playerCharacter={playerCharacter}
          onClose={() => setShowResultModal(false)}
          onBackToMenu={onBackToMenu}
          onChangeRole={handleChangeRole}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToMenu}
            className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4 inline" />
            Назад
          </button>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium">
              {playerCharacter === "hunter" ? "Охотник" : "Утка"}
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-8 h-8 rounded-md bg-muted flex items-center justify-center"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-lg font-medium text-card-foreground">{getCurrentTurnText()}</div>
        </div>

        {gameState.notifications && gameState.notifications.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            {gameState.notifications.map((notification: string, index: number) => (
              <div key={index} className="text-primary text-sm">
                {notification}
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
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

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-medium text-card-foreground mb-3">Статус</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Банк:</span>
                  <span className="font-medium">{gameState.hunterBet + gameState.duckBet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ваша ставка:</span>
                  <span className="font-medium">
                    {playerCharacter === "hunter" ? gameState.hunterBet : gameState.duckBet}
                  </span>
                </div>
              </div>

              {playerCharacter === "hunter" && (
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Патроны:</span>
                    <span className="font-medium">{gameState.ammo || 0}</span>
                  </div>

                  {gameState.inventory?.hunter?.binoculars && (
                    <button
                      onClick={handleBinoculars}
                      disabled={gameState.turn !== "hunter" || gameState.binocularUsedThisTurn}
                      className={`w-full mt-2 px-3 py-2 rounded-md text-sm font-medium ${
                        !gameState.binocularUsedThisTurn && gameState.turn === "hunter"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      <Telescope className="inline mr-1 h-4 w-4" />
                      Бинокль {gameState.binocularUsedThisTurn && "(использован)"}
                    </button>
                  )}
                </div>
              )}

              {playerCharacter === "duck" && typeof gameState.duckCell === "number" && gameState.duckCell >= 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Позиция: </span>
                    <span className="font-medium">Клетка {gameState.duckCell + 1}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
