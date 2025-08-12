"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { LEVELS, type LevelKey, gridSize } from "@/lib/game-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RotateCcw, Telescope, MoveRight, ShoppingBag, Zap, Shield, CloudRain, ArrowLeft, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import FeatherBurst from "@/components/feather-burst"
import GameBoard, { type CellOverlay } from "@/components/game-board"
import { useSound } from "@/hooks/use-sound"
import { createAI, type PlayerCharacter } from "@/lib/ai-opponent"
import {
  getGameStateAction,
  initializeGame,
  makeDuckInitialMove,
  makeHunterShot,
  makeDuckMove,
  useBinoculars,
  useDuckAbility,
  resetGame,
} from "@/app/game/actions"

// Types
type Turn = "pre-bets" | "duck-initial" | "hunter" | "duck" | "ended"
type EndReason =
  | "hunter-shot-duck"
  | "hunter-hit-beaver"
  | "duck-hit-beaver"
  | "hunter-out-of-ammo"
  | "hunter-hit-warden"
  | "duck-hit-warden"
type Outcome = { winner: "hunter" | "duck" | null; reason: EndReason }

type PlayerState = { gold: number; level: number }
type Payout = { hunterDelta: number; duckDelta: number; bankDelta: number; beaverDelta: number; wardenDelta?: number }

function sample<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}
function getRandomIndices(count: number, from: number[]) {
  const pool = [...from]
  const out: number[] = []
  while (out.length < count && pool.length) {
    const i = Math.floor(Math.random() * pool.length)
    out.push(pool[i])
    pool.splice(i, 1)
  }
  return out
}

// Artifacts inventory
type Inv = {
  hunter: {
    binoculars: boolean
    compass: boolean
    trap: boolean
    trapPlaced?: number | null
    apBullet: number
    extraAmmo: number
    eagleEye: boolean
    binocularsPlus: boolean
    enhancedPayout: boolean
    eagleEyeUsed?: boolean
  }
  duck: {
    flight: boolean
    safeFlight: boolean
    armoredFeatherRank: number
    autoFlight: boolean
    mirrorPlumage: boolean
    rain: boolean
    rainActive: boolean
    ghostFlight: boolean
    mirrorUsed?: boolean
    autoFlightUsed?: boolean
    rainUsed?: boolean
  }
}

function defaultInv(): Inv {
  return {
    hunter: {
      binoculars: false,
      compass: false,
      trap: false,
      trapPlaced: null,
      apBullet: 0,
      extraAmmo: 0,
      eagleEye: false,
      binocularsPlus: false,
      enhancedPayout: false,
      eagleEyeUsed: false,
    },
    duck: {
      flight: true, // базовый перелет доступен с начала
      safeFlight: false,
      armoredFeatherRank: 0,
      autoFlight: false,
      mirrorPlumage: false,
      rain: false,
      rainActive: false,
      ghostFlight: false,
      mirrorUsed: false,
      autoFlightUsed: false,
      rainUsed: false,
    },
  }
}

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
  const [levelKey, setLevelKey] = useState<LevelKey>(1)
  const level = LEVELS[levelKey]
  const totalCells = gridSize(level)

  // Sounds
  const { play, resume } = useSound()
  useEffect(() => {
    const onFirst = () => resume()
    window.addEventListener("pointerdown", onFirst, { once: true })
    return () => window.removeEventListener("pointerdown", onFirst)
  }, [resume])

  // Economy
  const [hunter, setHunter] = useState<PlayerState>({ gold: 500, level: 1 })
  const [duck, setDuck] = useState<PlayerState>({ gold: 500, level: 1 })
  const [bank, setBank] = useState(0)
  const [beaverVault, setBeaverVault] = useState(0)
  const [wardenVault, setWardenVault] = useState(0)

  // Shop bets
  const [hunterBet, setHunterBet] = useState(25)
  const [duckBet, setDuckBet] = useState(25)
  const SHOP = {
    binoculars: 40,
    flight: 40,
    compass: 60,
    trap: 50,
    safeFlight: 60,
    extraAmmo: 50,
    binocularsPlus: 80,
    autoFlight: 120,
    eagleEye: 160,
    mirrorPlumage: 160,
    rain: 120,
    ghostFlight: 140,
    apBullet: 120,
    enhancedPayout: 140,
    featherRank: [50, 100, 150, 200, 240, 280, 340, 400, 460],
  }

  const [inv, setInv] = useState<Inv>(defaultInv)

  // AI opponent
  const ai = useMemo(() => {
    if (isMultiplayer) return null
    return createAI(playerCharacter === "hunter" ? "duck" : "hunter")
  }, [playerCharacter, isMultiplayer])

  // Round state
  const [activeCells, setActiveCells] = useState<number[]>([])
  const [shotCells, setShotCells] = useState<Set<number>>(new Set())
  const [revealedEmptyByBinoculars, setRevealedEmptyByBinoculars] = useState<Set<number>>(new Set())
  const [binocularsUsedCells, setBinocularsUsedCells] = useState<Set<number>>(new Set())
  const [beaverCell, setBeaverCell] = useState<number | null>(null)
  const [wardenCell, setWardenCell] = useState<number | null>(null)
  const [duckCell, setDuckCell] = useState<number | null>(null)
  const [ammo, setAmmo] = useState(level.ammo)
  const [turn, setTurn] = useState<Turn>("pre-bets")
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [binocularUsedThisTurn, setBinocularUsedThisTurn] = useState(false)
  const [compassHint, setCompassHint] = useState<number[]>([])
  const [eagleEyeHighlight, setEagleEyeHighlight] = useState<number | null>(null)
  const [duckSnaredTurns, setDuckSnaredTurns] = useState(0)
  const [placeTrapMode, setPlaceTrapMode] = useState(false)

  // Animations
  const [lastShotAnim, setLastShotAnim] = useState<{ cell: number; id: number } | null>(null)
  const [showFeathers, setShowFeathers] = useState(false)

  // Ammo selection L4
  const [useAPBullet, setUseAPBullet] = useState(false)

  // AI thinking state
  const [aiThinking, setAiThinking] = useState(false)

  // Multiplayer state
  const [isLoading, setIsLoading] = useState(false)
  const [lastActionTimestamp, setLastActionTimestamp] = useState(0)
  const [gameInitialized, setGameInitialized] = useState(false)

  // Helpers
  const canChangeLevel = turn === "pre-bets" || turn === "ended"

  const [notifications, setNotifications] = useState<string[]>([])

  // Event-driven синхронизация - вызывается только после действий игрока
  const syncAfterAction = useCallback(async () => {
    if (!isMultiplayer || !lobbyId) return

    try {
      const result = await getGameStateAction(lobbyId)
      if (result.success && result.state) {
        const gameState = result.state

        // Проверяем, есть ли новые действия
        if (gameState.lastAction && gameState.lastAction.timestamp > lastActionTimestamp) {
          setLastActionTimestamp(gameState.lastAction.timestamp)

          // Обновляем локальное состояние
          setActiveCells(gameState.activeCells || [])
          setShotCells(new Set(gameState.shotCells || []))
          setRevealedEmptyByBinoculars(new Set(gameState.revealedEmptyByBinoculars || []))
          setBinocularsUsedCells(new Set(gameState.binocularsUsedCells || []))
          setBeaverCell(gameState.beaverCell)
          setWardenCell(gameState.wardenCell)
          setDuckCell(gameState.duckCell)
          setAmmo(gameState.ammo)
          setTurn(gameState.turn)
          setOutcome(gameState.outcome)
          setLevelKey(gameState.level as LevelKey)
          setHunterBet(gameState.hunterBet)
          setDuckBet(gameState.duckBet)
          setHunter({ gold: gameState.hunterGold, level: 1 })
          setDuck({ gold: gameState.duckGold, level: 1 })
          setBank(gameState.bank)
          setBeaverVault(gameState.beaverVault)
          setWardenVault(gameState.wardenVault)
          setInv(gameState.inventory || defaultInv())
          setCompassHint(gameState.compassHint || [])
          setBinocularUsedThisTurn(gameState.binocularUsedThisTurn || false)
          setDuckSnaredTurns(gameState.duckSnaredTurns || 0)

          setNotifications(gameState.notifications || [])

          if (gameState.notifications && gameState.notifications.length > 0) {
            const lastNotification = gameState.notifications[gameState.notifications.length - 1]
            if (lastNotification && !notifications.includes(lastNotification)) {
              // Показываем уведомление на 3 секунды
              setTimeout(() => {
                setNotifications((prev) => prev.filter((n) => n !== lastNotification))
              }, 3000)
            }
          }

          // Воспроизводим звуки и анимации
          const { type, data } = gameState.lastAction

          if (type === "hunter-shot" && data.cell !== undefined) {
            setLastShotAnim({ cell: data.cell, id: Date.now() })
            play(data.hit ? "hit" : "miss")

            if (data.hit) {
              setShowFeathers(true)
              setTimeout(() => setShowFeathers(false), 1400)
            }
          } else if (type === "duck-initial-move" && data.trapped) {
            play("trap")
          } else if (type === "duck-flight" && data.trapped) {
            play("trap")
          } else if (type === "use-safe-flight" && data.trapped) {
            play("trap")
          } else if (type === "use-rain") {
            play("rain")
          } else if (type === "use-binoculars") {
            play("ui")
          }
        }
      }
    } catch (error) {
      console.error("Error syncing game state:", error)
    }
  }, [isMultiplayer, lobbyId, lastActionTimestamp, play, notifications])

  // Инициализация игры для мультиплеера (только один раз)
  useEffect(() => {
    if (!isMultiplayer || !lobbyId || gameInitialized) return

    const initGame = async () => {
      setIsLoading(true)
      await initializeGame(lobbyId)
      await syncAfterAction()
      setGameInitialized(true)
      setIsLoading(false)
    }

    initGame()
  }, [isMultiplayer, lobbyId, gameInitialized, syncAfterAction])

  // Проверка на новые ходы противника (только когда не наш ход)
  useEffect(() => {
    if (!isMultiplayer || !lobbyId || !gameInitialized) return

    // Проверяем только если сейчас не наш ход
    const shouldCheckForUpdates =
      (turn === "duck-initial" && playerCharacter !== "duck") ||
      (turn === "hunter" && playerCharacter !== "hunter") ||
      (turn === "duck" && playerCharacter !== "duck")

    if (!shouldCheckForUpdates) return

    // Проверяем обновления каждые 2 секунды только когда ждем хода противника
    const interval = setInterval(syncAfterAction, 2000)
    return () => clearInterval(interval)
  }, [isMultiplayer, lobbyId, gameInitialized, turn, playerCharacter, syncAfterAction])

  const resetRoundState = useCallback(
    (keepBets = true) => {
      if (isMultiplayer && lobbyId) {
        // В мультиплеере сбрасываем через сервер
        resetGame(lobbyId).then(() => syncAfterAction())
        return
      }

      // Для одиночной игры - локальный сброс
      setActiveCells([])
      setShotCells(new Set())
      setRevealedEmptyByBinoculars(new Set())
      setBinocularsUsedCells(new Set())
      setBeaverCell(null)
      setWardenCell(null)
      setDuckCell(null)
      setAmmo(level.ammo + (inv.hunter.extraAmmo || 0))
      setTurn("pre-bets")
      setOutcome(null)
      setBinocularUsedThisTurn(false)
      setCompassHint([])
      setEagleEyeHighlight(null)
      setDuckSnaredTurns(0)
      setPlaceTrapMode(false)
      setLastShotAnim(null)
      setShowFeathers(false)
      setUseAPBullet(false)
      setAiThinking(false)
      // сброс одноразовых эффектов
      setInv((prev) => ({
        hunter: { ...prev.hunter, trapPlaced: null, eagleEyeUsed: false },
        duck: {
          ...prev.duck,
          rainActive: false,
          mirrorUsed: false,
          autoFlightUsed: false,
          rainUsed: false,
        },
      }))
      if (!keepBets) {
        setHunterBet(25)
        setDuckBet(25)
      }
    },
    [inv.hunter.extraAmmo, level.ammo, isMultiplayer, lobbyId, syncAfterAction],
  )

  useEffect(() => {
    console.log("Turn changed to:", turn, "Player character:", playerCharacter, "Is multiplayer:", isMultiplayer)

    // AI логика только для одиночной игры
    if (isMultiplayer) return

    if (turn === "duck-initial" && playerCharacter === "hunter") {
      console.log("Starting AI duck initial move...")
      const timer = setTimeout(() => handleAIDuckInitialMove(), 1000)
      return () => clearTimeout(timer)
    }

    if (turn === "hunter" && playerCharacter === "duck") {
      console.log("Starting AI hunter action...")
      const timer = setTimeout(() => handleAIHunterAction(), 1000)
      return () => clearTimeout(timer)
    }

    if (turn === "duck" && playerCharacter === "hunter") {
      console.log("Starting AI duck action...")
      const timer = setTimeout(() => handleAIDuckAction(), 1000)
      return () => clearTimeout(timer)
    }
  }, [turn, playerCharacter, isMultiplayer])

  function formatGold(n: number) {
    return `${Math.round(n)} 🪙`
  }

  // Purchasing
  function spendGold(player: "hunter" | "duck", cost: number) {
    const updater = (p: PlayerState) => ({ ...p, gold: p.gold - cost, level: p.level + 1 })
    if (player === "hunter") setHunter(updater)
    else setDuck(updater)
  }

  // Shop buy handlers
  function buy(key: keyof typeof SHOP, player: "hunter" | "duck") {
    const cost = (SHOP as any)[key] as number
    if (player === "hunter" && hunter.gold < cost) return
    if (player === "duck" && duck.gold < cost) return

    setInv((prev) => {
      const next = structuredClone(prev) as Inv
      if (player === "hunter") {
        switch (key) {
          case "binoculars":
            if (!next.hunter.binoculars) {
              next.hunter.binoculars = true
              spendGold("hunter", cost)
            }
            break
          case "compass":
            if (!next.hunter.compass) {
              next.hunter.compass = true
              spendGold("hunter", cost)
            }
            break
          case "trap":
            if (!next.hunter.trap) {
              next.hunter.trap = true
              next.hunter.trapPlaced = null
              spendGold("hunter", cost)
            }
            break
          case "extraAmmo":
            next.hunter.extraAmmo += 1
            spendGold("hunter", cost)
            break
          case "binocularsPlus":
            if (!next.hunter.binocularsPlus) {
              next.hunter.binocularsPlus = true
              spendGold("hunter", cost)
            }
            break
          case "eagleEye":
            if (!next.hunter.eagleEye) {
              next.hunter.eagleEye = true
              spendGold("hunter", cost)
            }
            break
          case "apBullet":
            next.hunter.apBullet += 1
            spendGold("hunter", cost)
            break
          case "enhancedPayout":
            if (!next.hunter.enhancedPayout) {
              next.hunter.enhancedPayout = true
              spendGold("hunter", cost)
            }
            break
        }
      } else {
        switch (key) {
          case "flight":
            if (!next.duck.flight) {
              next.duck.flight = true
              spendGold("duck", cost)
            }
            break
          case "safeFlight":
            if (!next.duck.safeFlight) {
              next.duck.safeFlight = true
              spendGold("duck", cost)
            }
            break
          case "autoFlight":
            if (!next.duck.autoFlight) {
              next.duck.autoFlight = true
              spendGold("duck", cost)
            }
            break
          case "mirrorPlumage":
            if (!next.duck.mirrorPlumage) {
              next.duck.mirrorPlumage = true
              spendGold("duck", cost)
            }
            break
          case "rain":
            if (!next.duck.rain) {
              next.duck.rain = true
              spendGold("duck", cost)
            }
            break
          case "ghostFlight":
            if (!next.duck.ghostFlight) {
              next.duck.ghostFlight = true
              spendGold("duck", cost)
            }
            break
        }
      }
      return next
    })
  }

  function buyFeatherRank() {
    const r = inv.duck.armoredFeatherRank
    if (r >= 9) return
    const price = SHOP.featherRank[r] ?? 0
    if (duck.gold < price) return
    setInv((prev) => ({ ...prev, duck: { ...prev.duck, armoredFeatherRank: r + 1 } }))
    spendGold("duck", price)
  }

  // Start round - только для одиночной игры
  function startRound() {
    if (isMultiplayer) return // В мультиплеере раунд запускается автоматически

    const hb = Math.max(1, Math.min(hunterBet, hunter.gold))
    const db = Math.max(1, Math.min(duckBet, duck.gold))
    if (hb <= 0 || db <= 0) return
    setHunter((p) => ({ ...p, gold: p.gold - hb }))
    setDuck((p) => ({ ...p, gold: p.gold - db }))

    const total = gridSize(level)
    const all = Array.from({ length: total }, (_, i) => i)
    const act =
      level.activeCellCount && level.activeCellCount < total
        ? getRandomIndices(level.activeCellCount, all).sort((a, b) => a - b)
        : all
    setActiveCells(act)

    const beav = sample(act)
    setBeaverCell(beav)

    if (level.hasWarden) {
      let w = sample(act)
      while (w === beav) w = sample(act)
      setWardenCell(w)
    } else {
      setWardenCell(null)
    }

    setShotCells(new Set())
    setRevealedEmptyByBinoculars(new Set())
    setBinocularsUsedCells(new Set())
    setAmmo(level.ammo + (inv.hunter.extraAmmo || 0))
    setOutcome(null)
    setBinocularUsedThisTurn(false)
    setDuckSnaredTurns(0)
    setPlaceTrapMode(false)
    setUseAPBullet(false)

    // Compass
    if (level.key >= 2 && inv.hunter.compass) {
      const others = act.filter((c) => c !== beav)
      const hint = [beav, ...getRandomIndices(2, others)]
      setCompassHint(hint)
    } else {
      setCompassHint([])
    }

    // Утка ходит первой
    setTurn("duck-initial")
  }

  // Payouts
  const calculateAndDistributePayout = useCallback(
    (reason: EndReason) => {
      const payout: Payout = { hunterDelta: 0, duckDelta: 0, bankDelta: 0, beaverDelta: 0, wardenDelta: 0 }
      const totalBank = hunterBet + duckBet

      switch (reason) {
        case "hunter-shot-duck": {
          const payoutRatio = inv.hunter.enhancedPayout ? 0.95 : 0.9
          let hunterShare = Math.round(totalBank * payoutRatio)
          let bankShare = totalBank - hunterShare

          // Дождь снижает выигрыш охотника
          if (inv.duck.rainActive && !useAPBullet) {
            const reduction = Math.round(totalBank * 0.3)
            hunterShare = Math.max(0, hunterShare - reduction)
            bankShare += reduction
          }

          payout.hunterDelta = hunterShare
          payout.bankDelta = bankShare
          break
        }
        case "hunter-out-of-ammo": {
          payout.duckDelta = totalBank
          break
        }
        case "duck-hit-beaver": {
          const duckLoss = duckBet * (1 - (inv.duck.armoredFeatherRank * 5) / 100)
          payout.hunterDelta = hunterBet + duckLoss * 0.5
          payout.beaverDelta = duckLoss * 0.3
          payout.bankDelta = duckLoss * 0.2
          payout.duckDelta = duckBet - duckLoss // Refund from feather
          break
        }
        case "hunter-hit-beaver": {
          const hunterLoss = hunterBet
          payout.duckDelta = duckBet + hunterLoss * 0.5
          payout.beaverDelta = hunterLoss * 0.3
          payout.bankDelta = hunterLoss * 0.2
          break
        }
        case "hunter-hit-warden": {
          const hunterLoss = hunterBet
          payout.hunterDelta = hunterLoss * 0.5
          payout.duckDelta = duckBet
          payout.wardenDelta = hunterLoss * 0.25
          payout.bankDelta = hunterLoss * 0.25
          break
        }
        case "duck-hit-warden": {
          const duckLoss = duckBet * (1 - (inv.duck.armoredFeatherRank * 5) / 100)
          payout.duckDelta = duckBet - duckLoss + duckLoss * 0.5
          payout.hunterDelta = hunterBet
          payout.wardenDelta = duckLoss * 0.25
          payout.bankDelta = duckLoss * 0.25
          break
        }
      }

      // Apply payouts
      setHunter((p) => ({
        ...p,
        gold: p.gold + payout.hunterDelta,
        level: p.level + (payout.hunterDelta > hunterBet ? 1 : 0),
      }))
      setDuck((p) => ({
        ...p,
        gold: p.gold + payout.duckDelta,
        level: p.level + (payout.duckDelta > duckBet ? 1 : 0),
      }))
      setBank((b) => b + payout.bankDelta)
      setBeaverVault((b) => b + payout.beaverDelta)
      setWardenVault((w) => w + (payout.wardenDelta || 0))

      return payout
    },
    [hunterBet, duckBet, inv, useAPBullet],
  )

  function endRound(res: Omit<Outcome, "payout">) {
    const payout = calculateAndDistributePayout(res.reason)
    setOutcome({ ...res, payout })
    setTurn("ended")
    setAiThinking(false)

    if (res.reason === "hunter-shot-duck") {
      setShowFeathers(true)
      setTimeout(() => setShowFeathers(false), 1400)
      play("hit")
    } else if (res.reason.includes("beaver")) {
      play("beaver")
    } else if (res.reason === "hunter-out-of-ammo") {
      play("duck")
    }
  }

  // Derived
  const overlays: Record<number, CellOverlay> = useMemo(
    () => {
      const map: Record<number, CellOverlay> = {}
      activeCells.forEach((i) => (map[i] = {}))
      shotCells.forEach((i) => (map[i] || {}), shot: true })
      )
    revealedEmptyByBinoculars.forEach((i) => (map[i] =
      ...(map[i] ||
      ), revealedEmpty: true
      ))
    binocularsUsedCells.forEach((i) => (map[i] =
      ...(map[i] ||
      ), binocularsUsed: true
      ))
    compassHint.forEach((i) => (map[i] =
      ...(map[i] ||
      ), compassHint: true
      ))
      if (turn === "ended" && beaverCell !== null) map[beaverCell] = { ...(map[beaverCell] || {}), beaver: true }
      if (turn === "ended" && wardenCell !== null) map[wardenCell] = { ...(map[wardenCell] || {}), warden: true }
      if (inv.hunter.trapPlaced != null)
      \
      map[inv.hunter.trapPlaced] =
      ...(map[inv.hunter.trapPlaced] ||
      ), trap: true
      \
      if (eagleEyeHighlight != null) map[eagleEyeHighlight] = { ...(map[eagleEyeHighlight] || {}), eagleEyeDuck: true }
      \
      // Утка видит свою позицию во время игры, охотник только в конце
      if (duckCell != null) {
        \
        if (turn === \"ended" || playerCharacter === "duck"
        )
        map[duckCell] = { ...(map[duckCell] || {}), duck: true }
      }

      return map
    },
    [
    activeCells,
    beaverCell,
    compassHint,
    duckCell,
    eagleEyeHighlight,
    inv.hunter.trapPlaced,
    shotCells,
    turn,
    revealedEmptyByBinoculars,
    binocularsUsedCells,\
    wardenCell,
    playerCharacter,
  ],
  )

  // AI Actions (только для одиночной игры)
  async function handleAIDuckInitialMove() {
    if (isMultiplayer) return

    console.log("=== AI Duck Initial Move Debug ===")
    console.log("Turn:", turn)
    console.log("Player character:", playerCharacter)
    \
    console.log("Active cells:\", activeCells)
    console.log("Shot cells:", Array.from(shotCells))
    console.log("Beaver cell:", beaverCell)
    console.log("Warden cell:", wardenCell)

    if (turn !== "duck-initial") {
      console.log("Wrong turn, expected duck-initial, got:", turn)
      return
    }

    if (playerCharacter !== "hunter\") {
      console.log("Wrong player character, expected hunter, got:", playerCharacter)
    return
  }

  setAiThinking(true)
  console.log("AI Duck making initial move...")

  // Для начального выбора позиции просто выбираем случайную безопасную клетку
  const safeCells = activeCells.filter((cell) => {
    \
    const notShot = !shotCells.has(cell)
    const notBeaver = cell !== beaverCell
    const notWarden = cell !== wardenCell
    const isSafe = notShot && notBeaver && notWarden
    console.log(`Cell ${cell}: notShot=${notShot}, notBeaver=${notBeaver}, notWarden=${notWarden}, isSafe=${isSafe}`)
    return isSafe
  })
  \
    console.log(\"Safe cells for duck:", safeCells)

  if (safeCells.length === 0) {
    console.log("No safe cells, choosing any active cell")
    const randomCell = sample(activeCells)
    console.log("Chosen cell:", randomCell)

    setTimeout(() => {
      console.log("Executing duck initial choose with cell:", randomCell)
      handleDuckInitialChoose(randomCell)
      setAiThinking(false)
    }, 1200)
    return
  }

  // Выбираем случайную безопасную клетку
  const randomCell = sample(safeCells)
  console.log("Chosen safe cell:", randomCell)

  // Добавляем задержку для реалистичности
  setTimeout(() => {
    console.log("Executing duck initial choose with safe cell:", randomCell)
    handleDuckInitialChoose(randomCell)
    setAiThinking(false)
  }, 1200)
}

async function handleAIHunterAction() {
  if (isMultiplayer) return
  if (turn !== "hunter" || playerCharacter !== "duck") return

  setAiThinking(true)

  // ВАЖНО: ИИ-охотник НЕ должен знать точную позицию утки!
  // Передаем null вместо duckCell
  const aiMove = await ai.makeMove({
    activeCells,
    shotCells: Array.from(shotCells),
    playerCell: null, // ИИ не знает где утка!
    beaverCell,
    wardenCell,
    level: level.key,
    ammo,
    compassHint,
    playerArtifacts: {
      hunter: {
        binoculars: inv.hunter.binoculars,
        trap: inv.hunter.trap,
        apBullet: inv.hunter.apBullet,
        eagleEye: inv.hunter.eagleEye,
      },
    },
  })

  if (aiMove.type === "shoot" && aiMove.target !== undefined) {
    handleHunterShoot(aiMove.target, true)
  } else if (aiMove.type === "use-ability" && aiMove.ability === "binoculars") {
    handleBinoculars()
  }

  setAiThinking(false)
}

async function handleAIDuckAction() {
  if (isMultiplayer) return
  if (turn !== "duck" || playerCharacter !== "hunter") return

  setAiThinking(true)
  const aiMove = await ai.makeMove({
    activeCells,
    shotCells: Array.from(shotCells),
    playerCell: duckCell, // ИИ-утка знает свою позицию
    beaverCell,
    wardenCell,
    level: level.key,
    ammo,
    duckSnaredTurns,
    playerArtifacts: {
      hunter: {
        binoculars: inv.hunter.binoculars,
        trap: inv.hunter.trap,
        apBullet: inv.hunter.apBullet,
        eagleEye: inv.hunter.eagleEye,
      },
    },
  })

  if (aiMove.type === "move" && aiMove.target !== undefined) {
    handleDuckFlight(aiMove.target)
  } else if (aiMove.type === "stay") {
    handleDuckStay()
  } else if (aiMove.type === "use-ability") {
    if (aiMove.ability === "rain") {
      handleRain()
    } else if (aiMove.ability === "safeFlight") {
      handleSafeFlight()
    }
  }

  setAiThinking(false)
}

// Actions
async function handleDuckInitialChoose(cell: number) {
  console.log("=== Duck Initial Choose Debug ===")
  console.log("Turn:", turn)
  console.log("Cell:", cell)
  console.log("Active cells includes cell:", activeCells.includes(cell))
  console.log("Shot cells has cell:", shotCells.has(cell))

  if (turn !== "duck-initial" || !activeCells.includes(cell)) {
    console.log("Invalid turn or cell")
    return
  }
  if (shotCells.has(cell)) {
    console.log("Cell already shot")
    return
  }

  // В мультиплеере используем серверные действия
  if (isMultiplayer && lobbyId && playerId) {
    setIsLoading(true)
    await makeDuckInitialMove(lobbyId, playerId)
    await syncAfterAction() // Синхронизируемся после действия
    setIsLoading(false)
    return
  }

  // Проверки на NPC
  if (level.hasWarden && wardenCell === cell) {
    console.log("Duck hit warden")
    setDuckCell(cell)
    endRound({ winner: "hunter", reason: "duck-hit-warden" })
    return
  }
  if (beaverCell === cell) {
    console.log("Duck hit beaver")
    setDuckCell(cell)
    endRound({ winner: "hunter", reason: "duck-hit-beaver" })
    return
  }

  console.log("Setting duck cell to:", cell)
  setDuckCell(cell)

  if (inv.hunter.trapPlaced === cell) {
    console.log("Duck hit trap")
    setDuckSnaredTurns(1)
    play("trap")
  }

  // Eagle Eye эффект
  if (level.key === 4 && inv.hunter.eagleEye && !inv.hunter.eagleEyeUsed) {
    console.log("Eagle eye effect triggered")
    setEagleEyeHighlight(cell)
    setTimeout(() => setEagleEyeHighlight(null), 1500)
    setInv((p) => ({ ...p, hunter: { ...p.hunter, eagleEyeUsed: true } }))
  }

  // Переход к следующему ходу
  console.log("Moving to hunter turn")
  setTurn("hunter")
  setBinocularUsedThisTurn(false)
}

// исправлена ошибка с хуками - убраны условные вызовы state setters
const handleBinoculars = useCallback(async () => {
  // Проверяем условия в начале
  const canUseBinoculars = turn === "hunter" && !binocularUsedThisTurn && inv.hunter.binoculars

  if (!canUseBinoculars) return

  // В мультиплеере используем серверные действия
  if (isMultiplayer && lobbyId && playerId) {
    setIsLoading(true)
    await useBinoculars(lobbyId, playerId)
    await syncAfterAction()
    setIsLoading(false)
    return
  }

  // Для одиночной игры - локальная логика
  const availableCells = activeCells.filter(
    (c) => !shotCells.has(c) && !revealedEmptyByBinoculars.has(c) && !binocularsUsedCells.has(c),
  )

  if (availableCells.length > 0) {
    const targetCell = sample(availableCells)

    // Отмечаем клетку как использованную биноклем
    setBinocularsUsedCells((prev) => new Set([...prev, targetCell]))

    // Проверяем что в клетке
    const empties = activeCells.filter(
      (c) =>
        c !== duckCell &&
        c !== beaverCell &&
        c !== wardenCell &&
        !shotCells.has(c) &&
        !revealedEmptyByBinoculars.has(c),
    )

    if (empties.includes(targetCell)) {
      setRevealedEmptyByBinoculars((prev) => new Set([...prev, targetCell]))
    }
  }

  // Всегда вызываем эти state setters безусловно
  setBinocularUsedThisTurn(true)
  play("ui")
}, [
  turn,
  binocularUsedThisTurn,
  inv.hunter.binoculars,
  isMultiplayer,
  lobbyId,
  playerId,
  syncAfterAction,
  activeCells,
  shotCells,
  revealedEmptyByBinoculars,
  binocularsUsedCells,
  duckCell,
  beaverCell,
  wardenCell,
  play,
])

async function handleHunterShoot(cell: number, isAI = false) {
  const canShoot = turn === "hunter" && activeCells.includes(cell) && !shotCells.has(cell)
  if (!canShoot) return
  if (!isAI && playerCharacter !== "hunter") return

  // В мультиплеере используем серверные действия
  if (isMultiplayer && lobbyId && playerId && !isAI) {
    setIsLoading(true)
    await makeHunterShot(lobbyId, playerId, cell, useAPBullet)
    setUseAPBullet(false)
    await syncAfterAction() // Синхронизируемся после действия
    setIsLoading(false)
    return
  }

  setLastShotAnim({ cell, id: Date.now() })
  play("shot")

  if (level.hasWarden && wardenCell === cell) {
    setShotCells((s) => new Set(s).add(cell))
    endRound({ winner: "duck", reason: "hunter-hit-warden" })
    return
  }
  if (beaverCell === cell) {
    setShotCells((s) => new Set(s).add(cell))
    endRound({ winner: "duck", reason: "hunter-hit-beaver" })
    return
  }
  if (duckCell === cell) {
    const isAP = useAPBullet && inv.hunter.apBullet > 0
    if (isAP) {
      setInv((p) => ({ ...p, hunter: { ...p.hunter, apBullet: p.hunter.apBullet - 1 } }))
      setUseAPBullet(false)
    }

    // Mirror plumage protection
    if (!isAP && inv.duck.mirrorPlumage && !inv.duck.mirrorUsed) {
      setInv((p) => ({ ...p, duck: { ...p.duck, mirrorUsed: true } }))
      const free = activeCells.filter((c) => !shotCells.has(c) && c !== cell)
      if (free.length > 0) {
        const reflectTarget = sample(free)
        if (Math.random() < 0.1) {
          // Hit hunter (self-damage)
          endRound({ winner: "duck", reason: "hunter-hit-beaver" })
          return
        }
        // Reflect to another cell
        setShotCells((s) => new Set(s).add(cell).add(reflectTarget))
        setAmmo((a) => a - 1)
        if (ammo - 1 <= 0) endRound({ winner: "duck", reason: "hunter-out-of-ammo" })
        else {
          setTurn("duck")
        }
        return
      }
    }

    // Auto flight protection
    if (!isAP && inv.duck.autoFlight && !inv.duck.autoFlightUsed) {
      const valid = activeCells.filter((c) => c !== beaverCell && c !== wardenCell && !shotCells.has(c) && c !== cell)
      if (valid.length >= 1) {
        setInv((p) => ({ ...p, duck: { ...p.duck, autoFlightUsed: true } }))
        setDuckCell(sample(valid))
        setShotCells((s) => new Set(s).add(cell))
        setAmmo((a) => a - 1)
        if (ammo - 1 <= 0) endRound({ winner: "duck", reason: "hunter-out-of-ammo" })
        else {
          setTurn("duck")
        }
        return
      }
    }

    setShotCells((s) => new Set(s).add(cell))
    endRound({ winner: "hunter", reason: "hunter-shot-duck" })
    return
  }

  // Miss
  setShotCells((s) => new Set(s).add(cell))
  setAmmo((a) => a - 1)
  play("miss")
  if (ammo - 1 <= 0) endRound({ winner: "duck", reason: "hunter-out-of-ammo" })
  else {
    setTurn("duck")
  }
}

const [isFlightMode, setIsFlightMode] = useState(false)

async function handleDuckStay() {
  if (turn !== "duck") return

  // В мультиплеере используем серверные действия
  if (isMultiplayer && lobbyId && playerId) {
    setIsLoading(true)
    await makeDuckMove(lobbyId, playerId, "stay")
    await syncAfterAction() // Синхронизируемся после действия
    setIsLoading(false)
    return
  }

  if (duckSnaredTurns > 0) {
    setDuckSnaredTurns(duckSnaredTurns - 1)
  }
  setTurn("hunter")
  setBinocularUsedThisTurn(false)
}

function startFlightMode() {
  if (turn !== "duck" || playerCharacter !== "duck") return
  if (!inv.duck.flight && !inv.duck.safeFlight && !inv.duck.ghostFlight) return
  if (duckSnaredTurns > 0) return
  setIsFlightMode(true)
}

async function handleDuckFlight(cell: number) {
  if (turn !== "duck" || !activeCells.includes(cell)) return

  // В мультиплеере используем серверные действия
  if (isMultiplayer && lobbyId && playerId) {
    setIsLoading(true)
    await makeDuckMove(lobbyId, playerId, "flight", cell)
    setIsFlightMode(false)
    await syncAfterAction() // Синхронизируемся после действия
    setIsLoading(false)
    return
  }

  const canUseShotCell = inv.duck.ghostFlight
  if (shotCells.has(cell) && !canUseShotCell) return

  // утка не может лететь туда где использовался бинокль
  if (binocularsUsedCells.has(cell)) return

  if (level.hasWarden && wardenCell === cell) {
    setDuckCell(cell)
    endRound({ winner: "hunter", reason: "duck-hit-warden" })
    return
  }
  if (beaverCell === cell) {
    setDuckCell(cell)
    endRound({ winner: "hunter", reason: "duck-hit-beaver" })
    return
  }

  setDuckCell(cell)
  setIsFlightMode(false)

  if (inv.hunter.trapPlaced === cell) {
    setDuckSnaredTurns(1)
    play("trap")
  }

  setTurn("hunter")
  setBinocularUsedThisTurn(false)
}

async function handleRain() {
  if (turn !== "duck" || level.key !== 4 || !inv.duck.rain || inv.duck.rainUsed) return

  // В мультиплеере используем серверные действия
  if (isMultiplayer && lobbyId && playerId) {
    setIsLoading(true)
    await useDuckAbility(lobbyId, playerId, "rain")
    await syncAfterAction() // Синхронизируемся после действия
    setIsLoading(false)
    return
  }

  setInv((p) => ({ ...p, duck: { ...p.duck, rainActive: true, rainUsed: true } }))
  setTurn("hunter")
  setBinocularUsedThisTurn(false)
  play("rain")
}

async function handleSafeFlight() {
  if (turn !== "duck" || !inv.duck.safeFlight) return

  // В мультиплеере используем серверные действия
  if (isMultiplayer && lobbyId && playerId) {
    setIsLoading(true)
    await useDuckAbility(lobbyId, playerId, "safeFlight")
    setIsFlightMode(false)
    await syncAfterAction() // Синхронизируемся после действия
    setIsLoading(false)
    return
  }

  const safe = activeCells.filter((c) => c !== beaverCell && c !== wardenCell && !shotCells.has(c) && c !== duckCell)
  if (safe.length === 0) return

  const dst = sample(safe)
  setDuckCell(dst)

  if (inv.hunter.trapPlaced === dst) {
    setDuckSnaredTurns(1)
    play("trap")
  }

  setTurn("hunter")
  setBinocularUsedThisTurn(false)
  setIsFlightMode(false)
}

function onCellClick(i: number) {
  if (aiThinking || isLoading) return // Блокируем клики во время хода ИИ или загрузки

  if (turn === "duck-initial" && playerCharacter === "duck") return handleDuckInitialChoose(i)
  if (turn === "hunter" && playerCharacter === "hunter") return handleHunterShoot(i)
  if (turn === "duck" && playerCharacter === "duck" && isFlightMode) return handleDuckFlight(i)
}

const canClickCell = useCallback(
  (i: number) => {
    if (!activeCells.includes(i) || isLoading) return false

    // В мультиплеере блокируем клики только если не наш ход
    if (isMultiplayer) {
      if (turn === "duck-initial" && playerCharacter !== "duck") return false
      if (turn === "hunter" && playerCharacter !== "hunter") return false
      if (turn === "duck" && playerCharacter !== "duck") return false
    } else {
      // В одиночной игре блокируем во время хода ИИ
      if (aiThinking) return false
    }

    if (turn === "duck-initial") {
      return !shotCells.has(i)
    }

    if (turn === "hunter") {
      return !shotCells.has(i)
    }

    if (turn === "duck" && isFlightMode) {
      // утка не может лететь туда где использовался бинокль
      if (binocularsUsedCells.has(i)) return false
      return inv.duck.ghostFlight ? true : !shotCells.has(i)
    }

    return false
  },
  [
    activeCells,
    isFlightMode,
    shotCells,
    binocularsUsedCells,
    turn,
    playerCharacter,
    inv.duck.ghostFlight,
    aiThinking,
    isMultiplayer,
    isLoading,
  ],
)

function newRound() {
  resetRoundState()
}

// Status text
const statusText = useMemo(() => {
  const characterName = playerCharacter === "hunter" ? "Охотник" : "Утка"
  const prefix = `${characterName} • Уровень ${level.key}: ${level.name} • `

  if (isLoading) {
    return prefix + "Обработка хода..."
  }

  if (!isMultiplayer && aiThinking) {
    const aiCharacter = playerCharacter === "hunter" ? "ИИ-утка" : "ИИ-охотник"
    return prefix + `${aiCharacter} думает...`
  }

  switch (turn) {
    case "pre-bets":
      return prefix + (isMultiplayer ? "Подготовка к игре..." : "Ставки и старт")
    case "duck-initial":
      if (isMultiplayer) {
        return (
          prefix +
          (playerCharacter === "duck" ? "Ваш ход: выберите начальную позицию" : "Ход утки: ожидание выбора позиции")
        )
      } else {
        return prefix + (playerCharacter === "duck" ? "Выберите начальную позицию" : "ИИ-утка выбирает позицию...")
      }
    case "hunter":
      if (isMultiplayer) {
        return (
          prefix + (playerCharacter === "hunter" ? "Ваш ход: выстрел или бинокль" : "Ход охотника: ожидание действия")
        )
      } else {
        return prefix + (playerCharacter === "hunter" ? "Ваш ход: выстрел или бинокль" : "Ход ИИ-охотника...")
      }
    case "duck":
      if (isMultiplayer) {
        if (playerCharacter === "duck") {
          return prefix + (duckSnaredTurns > 0 ? "Утка в капкане: пропуск хода" : "Ваш ход: затаиться или перелёт")
        } else {
          return prefix + "Ход утки: ожидание действия"
        }
      } else {
        if (playerCharacter === "duck") {
          return prefix + (duckSnaredTurns > 0 ? "Утка в капкане: пропуск хода" : "Ваш ход: затаиться или перелёт")
        } else {
          return prefix + "Ход ИИ-утки..."
        }
      }
    case "ended":
      if (!outcome) return prefix + "Раунд завершен"
      return prefix + (outcome.winner === "hunter" ? "Победа Охотника" : "Победа Утки")
    default:
      return prefix
  }
}, [duckSnaredTurns, level.key, level.name, outcome, turn, playerCharacter, aiThinking, isMultiplayer, isLoading])

const rows = level.rows
const cols = level.cols

const canStartRound = useMemo(() => {
  const levelReq = { 1: 1, 2: 5, 3: 10, 4: 15 }[levelKey]
  const levelOk = hunter.level >= levelReq && duck.level >= levelReq
  return levelOk && hunterBet === duckBet && hunterBet > 0 && hunterBet <= Math.min(hunter.gold, duck.gold)
}, [hunterBet, duckBet, hunter.gold, duck.gold, hunter.level, duck.level, levelKey])

return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {notifications.length > 0 && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4">
          {notifications.map((notification, index) => (
            <div key={index} className="text-blue-800 text-sm">
              {notification}
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="outline" onClick={onBackToMenu}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isMultiplayer ? "К лобби" : "Выбор персонажа"}
          </Button>

          <div className="flex items-center gap-3">
            <Image
              src={playerCharacter === "hunter" ? "/images/emoji/hunter-grin.png" : "/images/emoji/duck-sneaky.png"}
              alt={playerCharacter === "hunter" ? "Охотник" : "Утка"}
              width={32}
              height={32}
            />
            <div className="text-right">
              <div className="text-sm font-medium">{playerCharacter === "hunter" ? "Охотник" : "Утка"}</div>
              <div className="text-xs text-muted-foreground">
                {formatGold(playerCharacter === "hunter" ? hunter.gold : duck.gold)}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <LevelPicker
            disabled={!canChangeLevel}
            levelKey={levelKey}
            onChange={(k) => canChangeLevel && (setLevelKey(k), resetRoundState(false))}
            playerLevel={playerCharacter === "hunter" ? hunter.level : duck.level}
            opponentLevel={playerCharacter === "hunter" ? duck.level : hunter.level}
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base sm:text-lg">{statusText}</CardTitle>
              <div className="flex items-center gap-2">
                <HUDItem src="/images/ui/ammo.png" label="Патроны" value={ammo} />
                <Separator orientation="vertical" className="h-6" />
                <HUDItem src="/images/ui/bet.png" label="Ставка" value={hunterBet} small />
                <Separator orientation="vertical" className="h-6" />
                <HUDItem src="/images/ui/bank.png" label="Банк" value={bank} />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {turn === "pre-bets" && !isMultiplayer && (
              <div className="mb-3 flex flex-wrap items-end gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Ставка</label>
                  <Input
                    type="number"
                    min={1}
                    max={Math.min(hunter.gold, duck.gold)}
                    value={hunterBet}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setHunterBet(val)
                      setDuckBet(val)
                    }}
                    className="w-24"
                  />
                </div>
                <Button className="ml-auto" onClick={startRound} disabled={!canStartRound}>
                  {!canStartRound && hunterBet !== duckBet
                    ? "Ставки должны быть равными"
                    : !canStartRound
                      ? "Недостаточно средств/уровня"
                      : "Начать раунд"}
                </Button>
                <ShopDialog
                  level={level}
                  inv={inv}
                  prices={SHOP}
                  balances={{ hunter: hunter.gold, duck: duck.gold }}
                  buy={buy}
                  buyFeatherRank={buyFeatherRank}
                  playerCharacter={playerCharacter}
                />
              </div>
            )}

            {isMultiplayer && turn === "pre-bets" && (
              <div className="mb-3 flex justify-end">
                <ShopDialog
                  level={level}
                  inv={inv}
                  prices={SHOP}
                  balances={{ hunter: hunter.gold, duck: duck.gold }}
                  buy={buy}
                  buyFeatherRank={buyFeatherRank}
                  playerCharacter={playerCharacter}
                />
              </div>
            )}

            <div className="relative">
              <FeatherBurst show={showFeathers} />
              <GameBoard
                rows={rows}
                cols={cols}
                activeCells={activeCells}
                overlays={overlays}
                lastShotAnim={lastShotAnim}
                canClick={canClickCell}
                onCellClick={onCellClick}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {turn === "duck-initial" && (
                <Badge variant="secondary">
                  {isMultiplayer
                    ? playerCharacter === "duck"
                      ? "Выберите клетку для начальной позиции"
                      : "Ожидание хода утки..."
                    : "Выберите клетку для начальной позиции"}
                </Badge>
              )}

              {turn === "hunter" && (
                <>
                  {playerCharacter === "hunter" ? (
                    <>
                      <Button
                        variant={inv.hunter.binoculars && !binocularUsedThisTurn ? "secondary" : "outline"}
                        onClick={handleBinoculars}
                        disabled={!inv.hunter.binoculars || binocularUsedThisTurn || isLoading}
                      >
                        <Telescope className="mr-2 h-4 w-4" />
                        {"Бинокль"}
                      </Button>
                      {level.key === 4 && inv.hunter.apBullet > 0 && (
                        <Button
                          variant={useAPBullet ? "secondary" : "outline"}
                          onClick={() => setUseAPBullet((v) => !v)}
                          disabled={isLoading}
                        >
                          <Zap className="mr-2 h-4 w-4" />
                          {`Бронебойный (${inv.hunter.apBullet})`}
                        </Button>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {"Нажмите на клетку, чтобы выстрелить"}
                        <Target className="inline-block ml-1 h-3 w-3" />
                      </Badge>
                    </>
                  ) : isMultiplayer ? (
                    <Badge variant="secondary" className="animate-pulse">
                      Ход охотника...
                    </Badge>
                  ) : null}
                </>
              )}

              {turn === "duck" && (
                <>
                  {playerCharacter === "duck" ? (
                    <>
                      {duckSnaredTurns > 0 ? (
                        <Badge variant="destructive">{"Капкан: пропуск хода"}</Badge>
                      ) : (
                        <>
                          <Button variant="secondary" onClick={handleDuckStay} disabled={isLoading}>
                            {"Затаиться"}
                          </Button>
                          <Button
                            onClick={startFlightMode}
                            disabled={(!inv.duck.flight && !inv.duck.safeFlight && !inv.duck.ghostFlight) || isLoading}
                          >
                            <MoveRight className="mr-2 h-4 w-4" />
                            {"Перелет"}
                          </Button>
                          {inv.duck.safeFlight && (
                            <Button variant="outline" onClick={handleSafeFlight} disabled={isLoading}>
                              <Shield className="mr-2 h-4 w-4" />
                              {"Безопасный"}
                            </Button>
                          )}
                          {level.key === 4 && inv.duck.rain && !inv.duck.rainUsed && (
                            <Button variant="outline" onClick={handleRain} disabled={isLoading}>
                              <CloudRain className="mr-2 h-4 w-4" />
                              {"Дождь"}
                            </Button>
                          )}
                          {isFlightMode && <Badge variant="outline">{"Выберите клетку для перелета"}</Badge>}
                        </>
                      )}
                    </>
                  ) : isMultiplayer ? (
                    <Badge variant="secondary" className="animate-pulse">
                      Ход утки...
                    </Badge>
                  ) : null}
                </>
              )}

              {!isMultiplayer && aiThinking && (
                <Badge variant="secondary" className="animate-pulse">
                  {turn === "hunter"
                    ? "ИИ-охотник думает..."
                    : turn === "duck"
                      ? "ИИ-утка думает..."
                      : "ИИ-утка выбирает позицию..."}
                </Badge>
              )}

              {isLoading && (
                <Badge variant="secondary" className="animate-pulse">
                  Обработка хода...
                </Badge>
              )}

              {turn === "ended" && (
                <Button variant="default" onClick={newRound} disabled={isLoading}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {"Новый раунд"}
                </Button>
              )}
            </div>

            {outcome && (
              <div className="mt-4">
                <Alert>
                  <AlertTitle>
                    {
                      {
                        "hunter-shot-duck": "Победа Охотника",
                        "hunter-hit-beaver": "Охотник попал в Бобра",
                        "duck-hit-beaver": "Утка встретилась с Бобром",
                        "hunter-out-of-ammo": "Патроны закончились",
                        "hunter-hit-warden": "Охотник попал в Смотрителя",
                        "duck-hit-warden": "Утка встретилась со Смотрителем",
                      }[outcome.reason]
                    }
                  </AlertTitle>
                  <AlertDescription>
                    {outcome.reason === "hunter-shot-duck" &&
                      (inv.duck.rainActive
                        ? "Охотник побеждает, но дождь снизил его выигрыш на 30%"
                        : "Охотник забирает большую часть банка")}
                    {outcome.reason === "hunter-hit-beaver" &&
                      "Утка получает компенсацию за попадание охотника в бобра"}
                    {outcome.reason === "duck-hit-beaver" && "Охотник получает компенсацию за встречу утки с бобром"}
                    {outcome.reason === "hunter-out-of-ammo" && "Утка выжила и забирает весь банк"}
                    {outcome.reason === "hunter-hit-warden" &&
                      "Штраф за попадание в смотрителя: частичный возврат ставки"}
                    {outcome.reason === "duck-hit-warden" &&
                      "Штраф за встречу со смотрителем: частичный возврат ставки"}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
          <StatChip
            src="/images/emoji/hunter-grin.png"
            title="Охотник"
            value={`${formatGold(hunter.gold)} • Lv.${hunter.level}`}
          />
          <StatChip
            src="/images/emoji/duck-sneaky.png"
            title="Утка"
            value={`${formatGold(duck.gold)} • Lv.${duck.level}`}
          />
          <StatChip src="/images/ui/bank.png" title="Банк" value={formatGold(bank)} />
          <StatChip src="/images/ui/beaver-vault.png" title="Бобер" value={formatGold(beaverVault)} />
          {level.key === 4 && (
            <StatChip src="/images/ui/ranger.png" title="Смотритель" value={formatGold(wardenVault)} />
          )}
        </div>
      </div>
    </div>
  )
}

function HUDItem({
  src,
  label,
  value,
  small = false,
}: { src: string; label: string; value: number | string; small?: boolean }) {
  return (
    <div className={cn("flex items-center gap-1 rounded-md border bg-background/70 px-2 py-1", small && "text-xs")}>
      <Image src={src || "/placeholder.svg"} alt={label} width={small ? 16 : 18} height={small ? 16 : 18} />
      <span className="font-medium">{value}</span>
    </div>
  )
}

function StatChip({ src, title, value }: { src: string; title: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white/70 px-3 py-2 backdrop-blur-md dark:bg-black/30">
      <Image src={src || "/placeholder.svg"} alt={title} width={22} height={22} />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  )
}

function LevelPicker({
  levelKey,
  onChange,
  disabled,
  playerLevel,
  opponentLevel,
}: {
  levelKey: LevelKey
  onChange: (k: LevelKey) => void
  disabled?: boolean
  playerLevel: number
  opponentLevel: number
}) {
  const levelRequirements = { 1: 1, 2: 5, 3: 10, 4: 15 }

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white/70 px-2 py-1 backdrop-blur-md dark:bg-black/30">
      <span className="text-xs text-muted-foreground">{"Уровень:"}</span>
      {[1, 2, 3, 4].map((k) => {
        const req = levelRequirements[k as LevelKey]
        const isLocked = playerLevel < req || opponentLevel < req
        return (
          <Button
            key={k}
            size="sm"
            variant={levelKey === k ? "secondary" : "outline"}
            onClick={() => onChange(k as LevelKey)}
            disabled={disabled || isLocked}
            title={isLocked ? `Оба игрока должны быть ${req} уровня` : undefined}
          >
            {k}
            {isLocked && <span className="ml-1 text-xs">🔒</span>}
          </Button>
        )
      })}
    </div>
  )
}

function ShopDialog({
  level,
  inv,
  prices,
  balances,
  buy,
  buyFeatherRank,
  playerCharacter,
}: {
  level: any
  inv: any
  prices: any
  balances: { hunter: number; duck: number }
  buy: (key: string, player: "hunter" | "duck") => void
  buyFeatherRank: () => void
  playerCharacter: PlayerCharacter
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ShoppingBag className="mr-2 h-4 w-4" />
          {"Магазин"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{`Магазин (Уровень ${level.key})`}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={cn("rounded-lg border p-3", playerCharacter !== "hunter" && "opacity-60")}>
            <div className="mb-2 flex items-center gap-2">
              <Image src="/images/emoji/hunter-grin.png" alt="Охотник" width={22} height={22} />\
              <div className="font-medium">{"Охотник"}</div>
              <div className="ml-auto text-xs text-muted-foreground">{`Баланс: ${balances.hunter} 🪙`}</div>
            </div>
            <ShopRow
              icon="/images/ui/binoculars.png"
              title="Бинокль"
              desc={`Открывает ${inv.hunter.binocularsPlus ? "2" : "1"} пустые клетки`}
              price={prices.binoculars}
              owned={inv.hunter.binoculars}
              onBuy={() => buy("binoculars", "hunter")}
              disabled={playerCharacter !== "hunter"}
            />
            {level.key >= 2 && (
              <>
                <ShopRow
                  icon="/images/ui/compass.png"
                  title="Компас"
                  desc="Подсвечивает область с Бобром"
                  price={prices.compass}
                  owned={inv.hunter.compass}
                  onBuy={() => buy("compass", "hunter")}
                  disabled={playerCharacter !== "hunter"}
                />
                <ShopRow
                  icon="/images/ui/trap.png"
                  title="Капкан"
                  desc="Обездвиживает Утку на 1 ход"
                  price={prices.trap}
                  owned={inv.hunter.trap}
                  onBuy={() => buy("trap", "hunter")}
                  disabled={playerCharacter !== "hunter"}
                />
              </>
            )}
          </div>

          <div className={cn("rounded-lg border p-3", playerCharacter !== "duck" && "opacity-60")}>
            <div className="mb-2 flex items-center gap-2">
              <Image src="/images/emoji/duck-sneaky.png" alt="Утка" width={22} height={22} />
              <div className="font-medium">{"Утка"}</div>
              <div className="ml-auto text-xs text-muted-foreground">{`Баланс: ${balances.duck} 🪙`}</div>
            </div>
            <ShopRow
              icon="/images/ui/flight.png"
              title="Перелёт"
              desc="Перемещение на любую клетку"
              price={prices.flight}
              owned={inv.duck.flight}
              onBuy={() => buy("flight", "duck")}
              disabled={playerCharacter !== "duck"}
            />
            <ShopRow
              icon="/images/ui/shield-feather.png"
              title={`Бронированное перо R${inv.duck.armoredFeatherRank + 1}`}
              desc="Возврат части ставки при проигрыше"
              price={prices.featherRank[inv.duck.armoredFeatherRank] ?? 0}
              owned={inv.duck.armoredFeatherRank >= 9}
              onBuy={buyFeatherRank}
              disabled={playerCharacter !== "duck"}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShopRow({
  icon,
  title,
  desc,
  price,
  onBuy,
  owned,
  disabled = false,
}: {
  icon: string
  title: string
  desc: string
  price: number
  onBuy: () => void
  owned?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 min-w-0">
        <Image src={icon || "/placeholder.svg"} alt={title} width={28} height={28} />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{title}</div>
          <div className="text-xs text-muted-foreground truncate">{desc}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{`${price} 🪙`}</Badge>
        <Button size="sm" onClick={onBuy} disabled={!!owned || disabled}>
          {owned ? "Куплено" : disabled ? "Недоступно" : "Купить"}
        </Button>
      </div>
    </div>
  )
}
