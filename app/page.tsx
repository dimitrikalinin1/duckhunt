"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { LEVELS, type LevelKey, type LevelRules, gridSize } from "@/lib/game-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RotateCcw, Target, Telescope, MoveRight, ShoppingBag, Zap, Shield, CloudRain } from "lucide-react"
import { cn } from "@/lib/utils"
import SceneBackground from "@/components/scene-background"
import AppHeader from "@/components/app-header"
import FeatherBurst from "@/components/feather-burst"
import GameBoard, { type CellOverlay } from "@/components/game-board"
import { useSound } from "@/hooks/use-sound"

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
    apBullet: number // бронебойный патрон (заряды), L4
    extraAmmo: number
    eagleEye: boolean // L4
    binocularsPlus: boolean // L3
    enhancedPayout: boolean
    eagleEyeUsed?: boolean
  }
  duck: {
    flight: boolean
    safeFlight: boolean
    armoredFeatherRank: number // 0..9
    autoFlight: boolean // L3
    mirrorPlumage: boolean // L4 (один раз)
    rain: boolean // L4 активируемый эффект
    rainActive: boolean
    ghostFlight: boolean // L4 позволяет на обстрелянную клетку
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
      flight: false,
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

export default function Page() {
  const [levelKey, setLevelKey] = useState<LevelKey>(1)
  const level = LEVELS[levelKey]
  const totalCells = gridSize(level)
  const ALL = useMemo(() => Array.from({ length: totalCells }, (_, i) => i), [totalCells])

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
    // базовые
    binoculars: 40,
    flight: 40,
    // L2
    compass: 60,
    trap: 50,
    safeFlight: 60,
    extraAmmo: 50,
    // L3
    binocularsPlus: 80,
    autoFlight: 120,
    // L4
    eagleEye: 160,
    mirrorPlumage: 160,
    rain: 120,
    ghostFlight: 140,
    apBullet: 120,
    enhancedPayout: 140,
    // Пассивы пера (цены за ранг)
    featherRank: [50, 100, 150, 200, 240, 280, 340, 400, 460],
  }

  const [inv, setInv] = useState<Inv>(defaultInv)

  // Round state
  const [activeCells, setActiveCells] = useState<number[]>([])
  const [shotCells, setShotCells] = useState<Set<number>>(new Set())
  const [revealedEmptyByBinoculars, setRevealedEmptyByBinoculars] = useState<Set<number>>(new Set())
  const [beaverCell, setBeaverCell] = useState<number | null>(null)
  const [wardenCell, setWardenCell] = useState<number | null>(null) // L4
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

  // Helpers
  const canChangeLevel = turn === "pre-bets" || turn === "ended"

  // Local state
  const [duckInvisibleTurns, setDuckInvisibleTurns] = useState(0)

  const resetRoundState = useCallback(
    (keepBets = true) => {
      setActiveCells([])
      setShotCells(new Set())
      setRevealedEmptyByBinoculars(new Set())
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
      setDuckInvisibleTurns(0)
      // сброс одноразовых эффектов
      setInv((prev) => ({
        hunter: { ...prev.hunter, trapPlaced: null, eagleEyeUsed: false },
        duck: {
          ...prev.duck,
          rainActive: false,
          mirrorUsed: false,
          autoFlightUsed: false,
        },
      }))
      if (!keepBets) {
        setHunterBet(25)
        setDuckBet(25)
      }
    },
    [inv.hunter.extraAmmo, level.ammo],
  )

  function formatGold(n: number) {
    return `${Math.round(n)} 🪙`
  }

  // Purchasing
  function spendGold(player: "hunter" | "duck", cost: number) {
    if (player === "hunter") setHunter((p) => ({ ...p, gold: p.gold - cost, level: p.level + 1 }))
    else setDuck((p) => ({ ...p, gold: p.gold - cost, level: p.level + 1 }))
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

  // Start round
  function startRound() {
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
    setAmmo(level.ammo + (inv.hunter.extraAmmo || 0))
    setOutcome(null)
    setTurn("duck-initial")
    setBinocularUsedThisTurn(false)
    setDuckSnaredTurns(0)
    setPlaceTrapMode(false)
    setUseAPBullet(false)

    // Компас подсветка (L2+ при наличии у любого)
    if (level.key >= 2 && (inv.hunter.compass || true) /*расширяем и для утки в интерфейсе*/) {
      // подсветка области из 3 клеток, содержащей бобра
      const others = act.filter((c) => c !== beav)
      const hint = [beav, ...getRandomIndices(2, others)]
      setCompassHint(hint)
    } else {
      setCompassHint([])
    }

    // Орлиный глаз (L4)
    // if (level.key === 4 && inv.hunter.eagleEye && duckCell !== null) {
    //   setEagleEyeHighlight(duckCell)
    //   setTimeout(() => setEagleEyeHighlight(null), 1500)
    // }
  }

  // Payouts helpers
  function distributeOnHunterWin(normalBullet: boolean): Payout {
    const pot = hunterBet + duckBet
    let ratio = 0.9
    if (level.key === 4 && inv.hunter.enhancedPayout) ratio = 0.95
    let hunterShare = Math.round(pot * ratio)
    let bankFee = pot - hunterShare
    if (level.key === 4 && inv.duck.rainActive && normalBullet) {
      const reduction = Math.round(pot * 0.3)
      hunterShare = Math.max(0, hunterShare - reduction)
      bankFee += reduction
    }
    setBank((b) => b + bankFee)
    setHunter((p) => ({ ...p, gold: p.gold + hunterShare, level: p.level + 1 }))
    return { hunterDelta: hunterShare, duckDelta: 0, bankDelta: bankFee, beaverDelta: 0 }
  }

  function distributeOnBeaverHit(hitBy: "hunter" | "duck"): Payout {
    if (hitBy === "hunter") {
      const toDuck = Math.round(hunterBet * 0.5)
      const toBeaver = Math.round(hunterBet * 0.3)
      const toBank = Math.round(hunterBet * 0.2)
      setDuck((p) => ({ ...p, gold: p.gold + toDuck + duckBet, level: p.level + 1 }))
      setBeaverVault((s) => s + toBeaver)
      setBank((b) => b + toBank)
      return { hunterDelta: 0, duckDelta: toDuck + duckBet, bankDelta: toBank, beaverDelta: toBeaver }
    } else {
      const toHunter = Math.round(duckBet * 0.5)
      const toBeaver = Math.round(duckBet * 0.3)
      const toBank = Math.round(duckBet * 0.2)
      setHunter((p) => ({ ...p, gold: p.gold + toHunter + hunterBet, level: p.level + 1 }))
      setBeaverVault((s) => s + toBeaver)
      setBank((b) => b + toBank)
      return { hunterDelta: toHunter + hunterBet, duckDelta: 0, bankDelta: toBank, beaverDelta: toBeaver }
    }
  }

  function distributeOnDuckSurvive(): Payout {
    const pot = hunterBet + duckBet
    // Учитываем "Бронированное/Золотое перо" — возврат ставки при проигрыше утки, но здесь Утка выигрывает банк — не требуется
    setDuck((p) => ({ ...p, gold: p.gold + pot, level: p.level + 1 }))
    return { hunterDelta: 0, duckDelta: pot, bankDelta: 0, beaverDelta: 0 }
  }

  function distributeOnWardenHit(hitBy: "hunter" | "duck"): Payout {
    // Штраф: виновному возвращается только 50% его ставки; 25% — Банку, 25% — "смотрителю".
    // Ставка оппонента возвращается без изменений.
    if (hitBy === "hunter") {
      const half = Math.round(hunterBet * 0.5)
      const quarter = Math.round(hunterBet * 0.25)
      setHunter((p) => ({ ...p, gold: p.gold + half }))
      setDuck((p) => ({ ...p, gold: p.gold + duckBet, level: p.level + 1 }))
      setBank((b) => b + quarter)
      setWardenVault((w) => w + quarter)
      return { hunterDelta: half, duckDelta: duckBet, bankDelta: quarter, beaverDelta: 0, wardenDelta: quarter }
    } else {
      const half = Math.round(duckBet * 0.5)
      const quarter = Math.round(duckBet * 0.25)
      setDuck((p) => ({ ...p, gold: p.gold + half }))
      setHunter((p) => ({ ...p, gold: p.gold + hunterBet, level: p.level + 1 }))
      setBank((b) => b + quarter)
      setWardenVault((w) => w + quarter)
      return { hunterDelta: hunterBet, duckDelta: half, bankDelta: quarter, beaverDelta: 0, wardenDelta: quarter }
    }
  }

  function endRound(res: Outcome) {
    setOutcome(res)
    setTurn("ended")
    if (res.reason === "hunter-shot-duck") {
      distributeOnHunterWin(!useAPBullet)
      setShowFeathers(true)
      setTimeout(() => setShowFeathers(false), 1400)
      play("hit")
    } else if (res.reason === "hunter-hit-beaver") {
      distributeOnBeaverHit("hunter")
      play("beaver")
    } else if (res.reason === "duck-hit-beaver") {
      distributeOnBeaverHit("duck")
      play("beaver")
    } else if (res.reason === "hunter-out-of-ammo") {
      distributeOnDuckSurvive()
      play("duck")
    } else if (res.reason === "hunter-hit-warden") {
      distributeOnWardenHit("hunter")
      play("beaver")
    } else if (res.reason === "duck-hit-warden") {
      distributeOnWardenHit("duck")
      play("beaver")
    }
  }

  // Derived
  const overlays: Record<number, CellOverlay> = useMemo(() => {
    const map: Record<number, CellOverlay> = {}
    activeCells.forEach((i) => (map[i] = {}))
    shotCells.forEach((i) => (map[i] = { ...(map[i] || {}), shot: true }))
    revealedEmptyByBinoculars.forEach((i) => (map[i] = { ...(map[i] || {}), revealedEmpty: true }))
    compassHint.forEach((i) => (map[i] = { ...(map[i] || {}), compassHint: true }))
    if (turn === "ended" && beaverCell !== null) map[beaverCell] = { ...(map[beaverCell] || {}), beaver: true }
    if (turn === "ended" && wardenCell !== null) map[wardenCell] = { ...(map[wardenCell] || {}), warden: true }
    if (inv.hunter.trapPlaced != null)
      map[inv.hunter.trapPlaced] = { ...(map[inv.hunter.trapPlaced] || {}), trap: true }
    if (eagleEyeHighlight != null) map[eagleEyeHighlight] = { ...(map[eagleEyeHighlight] || {}), eagleEyeDuck: true }
    if (turn === "ended" && duckCell != null) map[duckCell] = { ...(map[duckCell] || {}), duck: true }
    return map
  }, [
    activeCells,
    beaverCell,
    compassHint,
    duckCell,
    eagleEyeHighlight,
    inv.hunter.trapPlaced,
    shotCells,
    turn,
    revealedEmptyByBinoculars,
    wardenCell,
  ])

  // Actions
  function handleDuckInitialChoose(cell: number) {
    if (turn !== "duck-initial" || !activeCells.includes(cell)) return
    // Нельзя на выстреленные, НПС
    if (shotCells.has(cell)) return
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
    if (level.key === 4 && inv.hunter.eagleEye && !inv.hunter.eagleEyeUsed) {
      setEagleEyeHighlight(cell)
      setTimeout(() => setEagleEyeHighlight(null), 1500)
      setInv((p) => ({ ...p, hunter: { ...p.hunter, eagleEyeUsed: true } }))
    }
    setTurn("hunter")
    setBinocularUsedThisTurn(false)
  }

  function handleBinoculars() {
    if (turn !== "hunter" || !inv.hunter.binoculars || binocularUsedThisTurn) return
    const empties = activeCells.filter(
      (c) =>
        c !== duckCell &&
        c !== beaverCell &&
        c !== wardenCell &&
        !shotCells.has(c) &&
        !revealedEmptyByBinoculars.has(c),
    )
    if (empties.length === 0) {
      setBinocularUsedThisTurn(true)
      return
    }
    const revealCount = inv.hunter.binocularsPlus ? 2 : 1
    const reveal = getRandomIndices(Math.min(revealCount, empties.length), empties)
    const next = new Set(revealedEmptyByBinoculars)
    reveal.forEach((r) => next.add(r))
    setRevealedEmptyByBinoculars(next)
    setBinocularUsedThisTurn(true)
    play("ui")
  }

  function handlePlaceTrapToggle() {
    if (turn !== "hunter" || !inv.hunter.trap || inv.hunter.trapPlaced != null) return
    setPlaceTrapMode((m) => !m)
    play("ui")
  }

  function tryPlaceTrap(cell: number) {
    if (!placeTrapMode) return false
    if (!activeCells.includes(cell)) return false
    if (shotCells.has(cell)) return false
    if (beaverCell === cell || wardenCell === cell || duckCell === cell) return false
    setInv((prev) => ({ ...prev, hunter: { ...prev.hunter, trapPlaced: cell } }))
    setPlaceTrapMode(false)
    play("trap")
    return true
  }

  function handleHunterShoot(cell: number) {
    if (turn !== "hunter" || !activeCells.includes(cell) || shotCells.has(cell)) return
    // Если мы в режиме установки капкана — ставим его
    if (tryPlaceTrap(cell)) return

    setLastShotAnim({ cell, id: Date.now() })
    play("shot")

    // Warden
    if (level.hasWarden && wardenCell === cell) {
      setShotCells((s) => new Set(s).add(cell))
      endRound({ winner: "duck", reason: "hunter-hit-warden" })
      return
    }
    // Beaver
    if (beaverCell === cell) {
      setShotCells((s) => new Set(s).add(cell))
      endRound({ winner: "duck", reason: "hunter-hit-beaver" })
      return
    }
    // Duck
    if (duckCell === cell) {
      // Легендарная защита
      if (!useAPBullet && level.key === 4 && inv.duck.mirrorPlumage && !inv.duck.mirrorUsed) {
        // Отражение: случайная свободная клетка
        setInv((prev) => ({ ...prev, duck: { ...prev.duck, mirrorUsed: true } }))
        const free = activeCells.filter((c) => !shotCells.has(c))
        const refTarget = sample(free)
        // шанс самоудара 10%
        if (Math.random() < 0.1) {
          endRound({ winner: "duck", reason: "hunter-hit-beaver" }) // считаем как "самоудар" ~ штраф, но используем близкий сценарий
          return
        }
        // Применим отражённый выстрел как обычный
        if (level.hasWarden && refTarget === wardenCell) {
          endRound({ winner: "duck", reason: "hunter-hit-warden" })
          return
        }
        if (refTarget === beaverCell) {
          endRound({ winner: "duck", reason: "hunter-hit-beaver" })
          return
        }
        // пусто — промах
        const nextShots = new Set(shotCells)
        nextShots.add(cell) // оригинал
        nextShots.add(refTarget)
        setShotCells(nextShots)
        const nextAmmo = ammo - 1
        setAmmo(nextAmmo)
        play("miss")
        if (nextAmmo <= 0) endRound({ winner: "duck", reason: "hunter-out-of-ammo" })
        else {
          setTurn("duck")
          setDuckInvisibleTurns((t) => Math.max(0, t - 1))
        }
        return
      }

      if (!useAPBullet && inv.duck.autoFlight && !inv.duck.autoFlightUsed) {
        // Автоперелёт, если есть минимум 2 свободные валидные клетки
        const valid = activeCells.filter((c) => c !== beaverCell && c !== wardenCell && !shotCells.has(c) && c !== cell)
        if (valid.length >= 1) {
          const dst = sample(valid)
          setInv((prev) => ({ ...prev, duck: { ...prev.duck, autoFlightUsed: true } }))
          setDuckCell(dst)
          const nextShots = new Set(shotCells)
          nextShots.add(cell)
          setShotCells(nextShots)
          const nextAmmo = ammo - 1
          setAmmo(nextAmmo)
          play("miss")
          if (nextAmmo <= 0) endRound({ winner: "duck", reason: "hunter-out-of-ammo" })
          else {
            setTurn("duck")
            setBinocularUsedThisTurn(false)
            setDuckInvisibleTurns((t) => Math.max(0, t - 1))
          }
          return
        }
      }

      // Бронебойный патрон игнорирует защиты
      if (useAPBullet) {
        setInv((p) => ({ ...p, hunter: { ...p.hunter, apBullet: Math.max(0, p.hunter.apBullet - 1) } }))
        setUseAPBullet(false)
      }

      setShotCells((s) => new Set(s).add(cell))
      endRound({ winner: "hunter", reason: "hunter-shot-duck" })
      return
    }

    // Miss
    const nextShots = new Set(shotCells)
    nextShots.add(cell)
    setShotCells(nextShots)
    const nextAmmo = ammo - 1
    setAmmo(nextAmmo)
    play("miss")
    if (nextAmmo <= 0) endRound({ winner: "duck", reason: "hunter-out-of-ammo" })
    else {
      setTurn("duck")
      setDuckInvisibleTurns((t) => Math.max(0, t - 1))
    }
  }

  // Duck actions
  const [isFlightMode, setIsFlightMode] = useState(false)
  function handleDuckStay() {
    if (turn !== "duck") return
    if (duckSnaredTurns > 0) {
      setDuckSnaredTurns(duckSnaredTurns - 1)
    }
    setTurn("hunter")
    setBinocularUsedThisTurn(false)
  }
  function startFlightMode() {
    if (turn !== "duck") return
    if (!inv.duck.flight && !inv.duck.safeFlight && !inv.duck.ghostFlight) return
    if (duckSnaredTurns > 0) return
    setIsFlightMode(true)
  }
  function handleDuckFlight(cell: number) {
    if (!isFlightMode || turn !== "duck" || !activeCells.includes(cell)) return
    if (level.hasWarden && wardenCell === cell) {
      setDuckCell(cell)
      setIsFlightMode(false)
      endRound({ winner: "hunter", reason: "duck-hit-warden" })
      return
    }
    if (beaverCell === cell) {
      setDuckCell(cell)
      setIsFlightMode(false)
      endRound({ winner: "hunter", reason: "duck-hit-beaver" })
      return
    }
    setDuckCell(cell)
    setIsFlightMode(false)
    // Капкан?
    if (inv.hunter.trapPlaced === cell) {
      setDuckSnaredTurns(1)
      play("trap")
    }
    if (inv.duck.ghostFlight) {
      setDuckInvisibleTurns(1)
    }
    setTurn("hunter")
    setBinocularUsedThisTurn(false)
  }

  function handleSafeFlight() {
    if (turn !== "duck" || !inv.duck.safeFlight) return
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

  function handleRain() {
    if (turn !== "duck" || level.key !== 4 || !inv.duck.rain || inv.duck.rainUsed) return
    setInv((p) => ({ ...p, duck: { ...p.duck, rainActive: true, rainUsed: true } }))
    setTurn("hunter")
    setBinocularUsedThisTurn(false)
    play("rain")
  }

  function onCellClick(i: number) {
    if (turn === "duck-initial") return handleDuckInitialChoose(i)
    if (turn === "hunter") return handleHunterShoot(i)
    if (turn === "duck" && isFlightMode) return handleDuckFlight(i)
  }

  const canClickCell = useCallback(
    (i: number) => {
      if (!activeCells.includes(i)) return false
      if (turn === "duck-initial") return !shotCells.has(i)
      if (turn === "hunter") return !shotCells.has(i)
      if (turn === "duck" && isFlightMode) return true
      return false
    },
    [activeCells, isFlightMode, shotCells, turn],
  )

  function newRound() {
    resetRoundState()
  }

  // Status text
  const statusText = useMemo(() => {
    const prefix = `Уровень ${level.key}: ${level.name} • `
    switch (turn) {
      case "pre-bets":
        return prefix + "Ставки и старт"
      case "duck-initial":
        return prefix + "Утка: выбрать клетку"
      case "hunter":
        return prefix + "Охотник: выстрел, бинокль или капкан"
      case "duck":
        return (
          prefix +
          (duckSnaredTurns > 0
            ? "Утка в капкане: пропуск хода"
            : inv.duck.flight
              ? "Утка: затаиться или перелёт"
              : "Утка: затаиться")
        )
      case "ended":
        if (!outcome) return prefix + "Раунд завершен"
        return prefix + (outcome.winner === "hunter" ? "Победа Охотника" : "Победа Утки")
      default:
        return prefix
    }
  }, [duckSnaredTurns, inv.duck.flight, level.key, level.name, outcome, turn])

  // UI
  const rows = level.rows
  const cols = level.cols

  return (
    <SceneBackground
      src={
        level.key === 2
          ? "/images/backgrounds/old-swamp.png"
          : level.key === 3
            ? "/images/backgrounds/mountain-lake.png"
            : level.key === 4
              ? "/images/backgrounds/reserve.png"
              : "/images/backgrounds/forest-edge.png"
      }
    >
      <AppHeader />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          {/* Level selector */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <LevelPicker
              disabled={!canChangeLevel}
              levelKey={levelKey}
              onChange={(k) => canChangeLevel && (setLevelKey(k), resetRoundState(false))}
            />
            <div className="ml-auto" />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base sm:text-lg">{statusText}</CardTitle>

                {/* HUD */}
                <div className="flex items-center gap-2">
                  <HUDItem src="/images/ui/ammo.png" label="Патроны" value={ammo} />
                  <Separator orientation="vertical" className="h-6" />
                  <HUDItem src="/images/ui/bet.png" label="Ставка Охотника" value={hunterBet} small />
                  <HUDItem src="/images/ui/bet.png" label="Ставка Утки" value={duckBet} small />
                  <Separator orientation="vertical" className="h-6" />
                  <HUDItem src="/images/ui/bank.png" label="Банк" value={bank} />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Bets toolbar (only before start) */}
              {turn === "pre-bets" && (
                <div className="mb-3 flex flex-wrap items-end gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Охотник</label>
                    <Input
                      type="number"
                      min={1}
                      max={hunter.gold}
                      value={hunterBet}
                      onChange={(e) => setHunterBet(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground">Баланс: {formatGold(hunter.gold)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Утка</label>
                    <Input
                      type="number"
                      min={1}
                      max={duck.gold}
                      value={duckBet}
                      onChange={(e) => setDuckBet(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground">Баланс: {formatGold(duck.gold)}</span>
                  </div>
                  <Button className="ml-auto" onClick={startRound}>
                    Начать раунд
                  </Button>
                  <ShopDialog
                    level={level}
                    inv={inv}
                    prices={SHOP}
                    balances={{ hunter: hunter.gold, duck: duck.gold }}
                    buy={buy}
                    buyFeatherRank={buyFeatherRank}
                  />
                </div>
              )}

              {/* Board */}
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

              {/* Controls */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {turn === "hunter" && (
                  <>
                    <Button
                      variant={inv.hunter.binoculars && !binocularUsedThisTurn ? "secondary" : "outline"}
                      onClick={handleBinoculars}
                      disabled={!inv.hunter.binoculars || binocularUsedThisTurn}
                    >
                      <Telescope className="mr-2 h-4 w-4" />
                      {"Бинокль"}
                      {inv.hunter.binocularsPlus && (
                        <Badge variant="outline" className="ml-2">
                          +1
                        </Badge>
                      )}
                    </Button>

                    {inv.hunter.trap && (
                      <Button
                        variant={placeTrapMode ? "secondary" : "outline"}
                        onClick={handlePlaceTrapToggle}
                        disabled={inv.hunter.trapPlaced != null}
                      >
                        <Image src="/images/ui/trap.png" alt="Капкан" width={16} height={16} className="mr-2" />
                        {inv.hunter.trapPlaced != null
                          ? "Капкан установлен"
                          : placeTrapMode
                            ? "Укажите клетку"
                            : "Поставить капкан"}
                      </Button>
                    )}

                    {level.key === 4 && inv.hunter.apBullet > 0 && (
                      <Button
                        variant={useAPBullet ? "secondary" : "outline"}
                        onClick={() => setUseAPBullet((v) => !v)}
                        title="Бронебойный патрон игнорирует защиты Утки"
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        {useAPBullet ? "Патрон: Бронебойный" : `Патрон: Обычный (${inv.hunter.apBullet})`}
                      </Button>
                    )}

                    <Badge variant="outline" className="text-xs">
                      {"Нажмите на клетку, чтобы выстрелить "}
                      <Target className="inline-block ml-1 h-4 w-4" />
                    </Badge>
                  </>
                )}

                {turn === "duck" && (
                  <>
                    {duckSnaredTurns > 0 ? (
                      <Badge variant="destructive">{"Капкан: пропуск хода"}</Badge>
                    ) : (
                      <>
                        <Button variant="secondary" onClick={handleDuckStay}>
                          {"Затаиться"}
                        </Button>
                        <Button
                          onClick={startFlightMode}
                          disabled={!inv.duck.flight && !inv.duck.safeFlight && !inv.duck.ghostFlight}
                        >
                          <MoveRight className="mr-2 h-4 w-4" />
                          {"Перелет"}
                        </Button>
                        {inv.duck.safeFlight && (
                          <Button variant="outline" onClick={handleSafeFlight}>
                            <Shield className="mr-2 h-4 w-4" />
                            {"Безопасный перелёт"}
                          </Button>
                        )}
                        {level.key === 4 && inv.duck.rain && !inv.duck.rainUsed && (
                          <Button variant="outline" onClick={handleRain}>
                            <CloudRain className="mr-2 h-4 w-4" />
                            {"Дождь"}
                          </Button>
                        )}
                        {isFlightMode && <span className="text-sm text-muted-foreground">{"Выберите клетку"}</span>}
                      </>
                    )}
                  </>
                )}

                {turn === "ended" && (
                  <Button variant="default" onClick={newRound}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {"Новый раунд"}
                  </Button>
                )}

                {/* Quick shop access */}
                {turn !== "pre-bets" && (
                  <ShopDialog
                    level={level}
                    inv={inv}
                    prices={SHOP}
                    balances={{ hunter: hunter.gold, duck: duck.gold }}
                    buy={buy}
                    buyFeatherRank={buyFeatherRank}
                  />
                )}
              </div>

              {/* Outcome banner */}
              {outcome && (
                <div className="mt-4">
                  <Alert>
                    <AlertTitle>
                      {outcome.reason === "hunter-shot-duck" && "Победа Охотника"}
                      {outcome.reason === "hunter-hit-beaver" && "Охотник попал в Бобра"}
                      {outcome.reason === "duck-hit-beaver" && "Утка встретилась с Бобром"}
                      {outcome.reason === "hunter-out-of-ammo" && "Патроны закончились"}
                      {outcome.reason === "hunter-hit-warden" && "Охотник попал в Смотрителя"}
                      {outcome.reason === "duck-hit-warden" && "Утка встретилась со Смотрителем"}
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      {outcome.reason === "hunter-shot-duck" &&
                        (level.key === 4 && inv.duck.rainActive
                          ? "Охотник побеждает: из-за Дождя его доля снижена на 30% (остальное — Банку)."
                          : level.key === 4 && inv.hunter.enhancedPayout
                            ? "Охотник забирает 95% банка (усиленные патроны)."
                            : "Охотник забирает 90% банка. Банк игры берет 10% комиссию.")}
                      {outcome.reason === "hunter-hit-beaver" &&
                        "Утка получает 50% ставки Охотника, 30% — Бобру, 20% — Банку. Ставка Утки возвращается."}
                      {outcome.reason === "duck-hit-beaver" &&
                        "Охотник получает 50% ставки Утки, 30% — Бобру, 20% — Банку. Ставка Охотника возвращается."}
                      {outcome.reason === "hunter-out-of-ammo" && "Утка выжила и забирает весь банк."}
                      {outcome.reason === "hunter-hit-warden" &&
                        "Штраф: Охотнику возвращается 50% своей ставки, по 25% — Банку и Смотрителю. Ставка Утки возвращается."}
                      {outcome.reason === "duck-hit-warden" &&
                        "Штраф: Утке возвращается 50% своей ставки, по 25% — Банку и Смотрителю. Ставка Охотника возвращается."}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer balances condensed */}
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
      </main>
    </SceneBackground>
  )
}

// UI bits
function HUDItem({
  src,
  label,
  value,
  small = false,
}: { src: string; label: string; value: number | string; small?: boolean }) {
  return (
    <div className={cn("flex items-center gap-1 rounded-md border bg-background/70 px-2 py-1", small && "text-xs")}>
      <Image
        src={src || "/placeholder.svg"}
        alt={label}
        width={small ? 16 : 18}
        height={small ? 16 : 18}
        className="rounded"
      />
      <span className="font-medium">{value}</span>
    </div>
  )
}
function StatChip({ src, title, value }: { src: string; title: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white/70 px-3 py-2 backdrop-blur-md dark:bg-black/30">
      <Image src={src || "/placeholder.svg"} alt={title} width={22} height={22} className="rounded" />
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
}: { levelKey: LevelKey; onChange: (k: LevelKey) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white/70 px-2 py-1 backdrop-blur-md dark:bg-black/30">
      <span className="text-xs text-muted-foreground">{"Уровень:"}</span>
      {[1, 2, 3, 4].map((k) => (
        <Button
          key={k}
          size="sm"
          variant={levelKey === k ? "secondary" : "outline"}
          onClick={() => onChange(k as LevelKey)}
          disabled={disabled}
        >
          {k}
        </Button>
      ))}
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
}: {
  level: LevelRules
  inv: any
  prices: any
  balances: { hunter: number; duck: number }
  buy: (key: string, player: "hunter" | "duck") => void
  buyFeatherRank: () => void
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
          {/* Hunter side */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <Image src="/images/emoji/hunter-grin.png" alt="Охотник" width={22} height={22} />
              <div className="font-medium">{"Охотник"}</div>
              <div className="ml-auto text-xs text-muted-foreground">{`Баланс: ${balances.hunter} 🪙`}</div>
            </div>

            <ShopRow
              icon="/images/ui/binoculars.png"
              title="Бинокль"
              desc={`Открывает ${inv.hunter.binocularsPlus ? "2" : "1"} пустые клетки перед выстрелом`}
              price={prices.binoculars}
              owned={inv.hunter.binoculars}
              onBuy={() => buy("binoculars", "hunter")}
            />
            {level.key >= 2 && (
              <>
                <ShopRow
                  icon="/images/ui/compass.png"
                  title="Компас"
                  desc="В начале раунда подсвечивает область 3 клеток с Бобром"
                  price={prices.compass}
                  owned={inv.hunter.compass}
                  onBuy={() => buy("compass", "hunter")}
                />
                <ShopRow
                  icon="/images/ui/trap.png"
                  title="Капкан"
                  desc="Один раз за раунд: обездвиживает Утку на 1 ход"
                  price={prices.trap}
                  owned={inv.hunter.trap}
                  onBuy={() => buy("trap", "hunter")}
                />
                <ShopRow
                  icon="/images/ui/ammo.png"
                  title="Доп. патрон"
                  desc="Плюс один патрон в раунде"
                  price={prices.extraAmmo}
                  onBuy={() => buy("extraAmmo", "hunter")}
                />
              </>
            )}
            {level.key >= 3 && (
              <ShopRow
                icon="/images/ui/binoculars.png"
                title="Улучшенный бинокль"
                desc="Открывает 2 пустые клетки"
                price={prices.binocularsPlus}
                owned={inv.hunter.binocularsPlus}
                onBuy={() => buy("binocularsPlus", "hunter")}
              />
            )}
            {level.key >= 4 && (
              <>
                <ShopRow
                  icon="/images/ui/level-up.png"
                  title="Орлиный глаз"
                  desc="В начале раунда подсвечивает клетку Утки (1 ход)"
                  price={prices.eagleEye}
                  owned={inv.hunter.eagleEye}
                  onBuy={() => buy("eagleEye", "hunter")}
                />
                <ShopRow
                  icon="/images/ui/danger.png"
                  title="Бронебойный патрон"
                  desc="Игнорирует защиты Утки (одноразовый)"
                  price={prices.apBullet}
                  onBuy={() => buy("apBullet", "hunter")}
                />
                <ShopRow
                  icon="/images/ui/ammo.png"
                  title="Усиленные патроны"
                  desc="Повышают долю выигрыша до 95% (обычные патроны)"
                  price={prices.enhancedPayout}
                  owned={inv.hunter.enhancedPayout}
                  onBuy={() => buy("enhancedPayout", "hunter")}
                />
              </>
            )}
          </div>

          {/* Duck side */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <Image src="/images/emoji/duck-sneaky.png" alt="Утка" width={22} height={22} />
              <div className="font-medium">{"Утка"}</div>
              <div className="ml-auto text-xs text-muted-foreground">{`Баланс: ${balances.duck} 🪙`}</div>
            </div>

            <ShopRow
              icon="/images/ui/flight.png"
              title="Перелёт"
              desc="Перемещение на любую свободную активную клетку"
              price={prices.flight}
              owned={inv.duck.flight}
              onBuy={() => buy("flight", "duck")}
            />
            <ShopRow
              icon="/images/ui/shield-feather.png"
              title={`Бронированное перо R${inv.duck.armoredFeatherRank + 1}`}
              desc="Возврат части ставки при проигрыше (5→45%)"
              price={prices.featherRank[inv.duck.armoredFeatherRank] ?? 0}
              owned={inv.duck.armoredFeatherRank >= 9}
              onBuy={buyFeatherRank}
            />

            {level.key >= 2 && (
              <ShopRow
                icon="/images/ui/safe-flight.png"
                title="Безопасный перелёт"
                desc="Случайная безопасная клетка (без НПС/меток)"
                price={prices.safeFlight}
                owned={inv.duck.safeFlight}
                onBuy={() => buy("safeFlight", "duck")}
              />
            )}
            {level.key >= 3 && (
              <ShopRow
                icon="/images/ui/ghost-flight.png"
                title="Автоперелёт при попадании"
                desc="При выстреле Охотника Утка мгновенно перелетит"
                price={prices.autoFlight}
                owned={inv.duck.autoFlight}
                onBuy={() => buy("autoFlight", "duck")}
              />
            )}
            {level.key >= 4 && (
              <>
                <ShopRow
                  icon="/images/ui/ghost-flight.png"
                  title="Призрачный перелёт"
                  desc="Можно на обстрелянные клетки; невидимость (упрощено)"
                  price={prices.ghostFlight}
                  owned={inv.duck.ghostFlight}
                  onBuy={() => buy("ghostFlight", "duck")}
                />
                <ShopRow
                  icon="/images/ui/gold-trophy.png"
                  title="Зеркальное оперение"
                  desc="Один раз отражает выстрел Охотника"
                  price={prices.mirrorPlumage}
                  owned={inv.duck.mirrorPlumage}
                  onBuy={() => buy("mirrorPlumage", "duck")}
                />
                <ShopRow
                  icon="/images/ui/rain-cloud.png"
                  title="Дождь"
                  desc="Снижает эффект обычных патронов на 30% в этом раунде"
                  price={prices.rain}
                  owned={inv.duck.rain}
                  onBuy={() => buy("rain", "duck")}
                />
              </>
            )}
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
}: {
  icon: string
  title: string
  desc: string
  price: number
  onBuy: () => void
  owned?: boolean
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
        <Button size="sm" onClick={onBuy} disabled={!!owned}>
          {owned ? "Куплено" : "Купить"}
        </Button>
      </div>
    </div>
  )
}
