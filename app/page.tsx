"use client"

import Image from "next/image"
import { useCallback, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, RotateCcw, Target, TelescopeIcon as Binoculars, MoveRight } from "lucide-react"
import { cn } from "@/lib/utils"

type Turn = "pre-bets" | "duck-initial" | "hunter" | "duck" | "ended"

type EndReason = "hunter-shot-duck" | "hunter-hit-beaver" | "duck-hit-beaver" | "hunter-out-of-ammo"

type Outcome = {
  winner: "hunter" | "duck" | null
  reason: EndReason
}

type Payout = {
  hunterDelta: number
  duckDelta: number
  bankDelta: number
  beaverDelta: number
}

type PlayerState = {
  gold: number
  level: number
}

type RoundConfig = {
  level: 1 // prototype implements Level 1 rules
  hunterAmmo: number
  activeCellCount: number
}

const GRID_SIZE = 9
const CELLS = Array.from({ length: GRID_SIZE }, (_, i) => i)

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

function formatGold(n: number) {
  return `${Math.round(n)} 🪙`
}

export default function Page() {
  // Players
  const [hunter, setHunter] = useState<PlayerState>({ gold: 500, level: 1 })
  const [duck, setDuck] = useState<PlayerState>({ gold: 500, level: 1 })
  const [bank, setBank] = useState(0)
  const [beaverVault, setBeaverVault] = useState(0)

  // Shop (Level 1)
  const [hunterHasBinoculars, setHunterHasBinoculars] = useState(false)
  const [duckHasFlight, setDuckHasFlight] = useState(false)

  // Bets
  const [hunterBet, setHunterBet] = useState(25)
  const [duckBet, setDuckBet] = useState(25)

  // Round config (Level 1)
  const cfg: RoundConfig = useMemo(
    () => ({
      level: 1,
      hunterAmmo: 3,
      activeCellCount: 6,
    }),
    [],
  )

  // Board and entities
  const [activeCells, setActiveCells] = useState<number[]>([])
  const [shotCells, setShotCells] = useState<Set<number>>(new Set())
  const [revealedEmptyByBinoculars, setRevealedEmptyByBinoculars] = useState<Set<number>>(new Set())
  const [beaverCell, setBeaverCell] = useState<number | null>(null)
  const [duckCell, setDuckCell] = useState<number | null>(null)
  const [ammo, setAmmo] = useState(cfg.hunterAmmo)
  const [turn, setTurn] = useState<Turn>("pre-bets")
  const [log, setLog] = useState<string[]>([])
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [binocularUsedThisTurn, setBinocularUsedThisTurn] = useState(false)

  const resetRoundState = useCallback(() => {
    setActiveCells([])
    setShotCells(new Set())
    setRevealedEmptyByBinoculars(new Set())
    setBeaverCell(null)
    setDuckCell(null)
    setAmmo(cfg.hunterAmmo)
    setTurn("pre-bets")
    setLog([])
    setOutcome(null)
    setBinocularUsedThisTurn(false)
  }, [cfg.hunterAmmo])

  function appendLog(s: string) {
    setLog((prev) => [s, ...prev].slice(0, 20))
  }

  // Shop actions (very simple prototype pricing)
  const SHOP = {
    binocularsCost: 40,
    flightCost: 40,
  }

  function buyBinoculars() {
    if (hunterHasBinoculars) return
    if (hunter.gold < SHOP.binocularsCost) return
    setHunter((p) => ({ gold: p.gold - SHOP.binocularsCost, level: p.level + 1 }))
    setHunterHasBinoculars(true)
    appendLog("Охотник купил Бинокль (+1 уровень).")
  }

  function buyFlight() {
    if (duckHasFlight) return
    if (duck.gold < SHOP.flightCost) return
    setDuck((p) => ({ gold: p.gold - SHOP.flightCost, level: p.level + 1 }))
    setDuckHasFlight(true)
    appendLog("Утка купила артефакт «Перелет» (+1 уровень).")
  }

  // Start round after bets
  function startRound() {
    // Validate bets
    const hb = Math.max(0, Math.min(hunterBet, hunter.gold))
    const db = Math.max(0, Math.min(duckBet, duck.gold))
    if (hb <= 0 || db <= 0) {
      appendLog("Ставки должны быть больше нуля.")
      return
    }

    // Deduct bets into pot lock
    setHunter((p) => ({ ...p, gold: p.gold - hb }))
    setDuck((p) => ({ ...p, gold: p.gold - db }))

    // Initialize board
    const act = getRandomIndices(cfg.activeCellCount, CELLS).sort((a, b) => a - b)
    const bCell = sample(act)
    setActiveCells(act)
    setBeaverCell(bCell)
    setShotCells(new Set())
    setRevealedEmptyByBinoculars(new Set())
    setAmmo(cfg.hunterAmmo)
    setDuckCell(null)
    setOutcome(null)
    setTurn("duck-initial")
    setBinocularUsedThisTurn(false)

    appendLog("Раунд начался. Утка ходит первой и выбирает клетку для укрытия.")
  }

  // Payout helpers
  function distributeOnHunterWin(): Payout {
    const pot = hunterBet + duckBet
    const bankFee = Math.round(pot * 0.1)
    const hunterGain = pot - bankFee
    setBank((b) => b + bankFee)
    setHunter((p) => ({ ...p, gold: p.gold + hunterGain }))
    return { hunterDelta: hunterGain, duckDelta: 0, bankDelta: bankFee, beaverDelta: 0 }
  }

  // On beaver hit, we assume opponent’s own bet is returned
  function distributeOnBeaverHit(hitBy: "hunter" | "duck"): Payout {
    if (hitBy === "hunter") {
      const giveToDuck = Math.round(hunterBet * 0.5)
      const giveToBeaver = Math.round(hunterBet * 0.3)
      const giveToBank = Math.round(hunterBet * 0.2)
      // Opponent bet (duck) returned
      setDuck((p) => ({ ...p, gold: p.gold + giveToDuck + duckBet }))
      setBeaverVault((s) => s + giveToBeaver)
      setBank((b) => b + giveToBank)
      return { hunterDelta: 0, duckDelta: giveToDuck + duckBet, bankDelta: giveToBank, beaverDelta: giveToBeaver }
    } else {
      const giveToHunter = Math.round(duckBet * 0.5)
      const giveToBeaver = Math.round(duckBet * 0.3)
      const giveToBank = Math.round(duckBet * 0.2)
      // Opponent bet (hunter) returned
      setHunter((p) => ({ ...p, gold: p.gold + giveToHunter + hunterBet }))
      setBeaverVault((s) => s + giveToBeaver)
      setBank((b) => b + giveToBank)
      return { hunterDelta: giveToHunter + hunterBet, duckDelta: 0, bankDelta: giveToBank, beaverDelta: giveToBeaver }
    }
  }

  // If hunter out of ammo, award full pot to Duck (Level 1 assumption: no commission on выживание)
  function distributeOnDuckSurvive(): Payout {
    const pot = hunterBet + duckBet
    setDuck((p) => ({ ...p, gold: p.gold + pot }))
    return { hunterDelta: 0, duckDelta: pot, bankDelta: 0, beaverDelta: 0 }
  }

  function endRound(res: Outcome) {
    setOutcome(res)
    setTurn("ended")
    if (res.reason === "hunter-shot-duck") {
      // Level-up on victory
      setHunter((p) => ({ ...p, level: p.level + 1 }))
      const pay = distributeOnHunterWin()
      appendLog(
        `Охотник победил! Получает ${formatGold(pay.hunterDelta)}. Комиссия банка: ${formatGold(pay.bankDelta)}.`,
      )
    } else if (res.reason === "hunter-hit-beaver") {
      const pay = distributeOnBeaverHit("hunter")
      appendLog(
        `Охотник попал в Бобра — мгновенное поражение! Утка получает ${formatGold(
          pay.duckDelta,
        )}. Бобру: ${formatGold(pay.beaverDelta)}, Банку: ${formatGold(pay.bankDelta)}.`,
      )
      setDuck((p) => ({ ...p, level: p.level + 1 }))
    } else if (res.reason === "duck-hit-beaver") {
      const pay = distributeOnBeaverHit("duck")
      appendLog(
        `Утка села на клетку с Бобром и проиграла! Охотник получает ${formatGold(
          pay.hunterDelta,
        )}. Бобру: ${formatGold(pay.beaverDelta)}, Банку: ${formatGold(pay.bankDelta)}.`,
      )
      setHunter((p) => ({ ...p, level: p.level + 1 }))
    } else if (res.reason === "hunter-out-of-ammo") {
      const pay = distributeOnDuckSurvive()
      appendLog(`У охотника закончились патроны — Утка выжила и забирает банк ${formatGold(pay.duckDelta)}.`)
      setDuck((p) => ({ ...p, level: p.level + 1 }))
    }
  }

  // Actions
  function handleDuckInitialChoose(cell: number) {
    if (turn !== "duck-initial") return
    if (!activeCells.includes(cell)) return
    if (beaverCell === cell) {
      // Duck instantly loses on beaver
      setDuckCell(cell)
      endRound({ winner: "hunter", reason: "duck-hit-beaver" })
      return
    }
    setDuckCell(cell)
    setTurn("hunter")
    setBinocularUsedThisTurn(false)
    appendLog(`Утка затаилась в выбранной клетке. Ход Охотника.`)
  }

  function handleBinoculars() {
    if (turn !== "hunter") return
    if (!hunterHasBinoculars || binocularUsedThisTurn) return

    // Reveal a random currently empty, active, not-shot cell
    const empties = activeCells.filter(
      (c) => c !== duckCell && c !== beaverCell && !shotCells.has(c) && !revealedEmptyByBinoculars.has(c),
    )
    if (empties.length === 0) {
      appendLog("Бинокль не нашел подходящих пустых клеток.")
      setBinocularUsedThisTurn(true)
      return
    }
    const revealed = sample(empties)
    const next = new Set(revealedEmptyByBinoculars)
    next.add(revealed)
    setRevealedEmptyByBinoculars(next)
    setBinocularUsedThisTurn(true)
    appendLog(`Бинокль подсказал: клетка ${humanCell(revealed)} пуста.`)
  }

  function handleHunterShoot(cell: number) {
    if (turn !== "hunter") return
    if (!activeCells.includes(cell)) return
    if (shotCells.has(cell)) return

    if (cell === beaverCell) {
      setShotCells((s) => new Set(s).add(cell))
      endRound({ winner: "duck", reason: "hunter-hit-beaver" })
      return
    }
    if (cell === duckCell) {
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
    appendLog(`Выстрел в клетку ${humanCell(cell)} — промах. Осталось патронов: ${nextAmmo}.`)
    if (nextAmmo <= 0) {
      endRound({ winner: "duck", reason: "hunter-out-of-ammo" })
    } else {
      setTurn("duck")
    }
  }

  const [isFlightMode, setIsFlightMode] = useState(false)

  function handleDuckStay() {
    if (turn !== "duck") return
    appendLog("Утка затаилась и осталась на месте.")
    setTurn("hunter")
    setBinocularUsedThisTurn(false)
  }

  function startFlightMode() {
    if (turn !== "duck") return
    if (!duckHasFlight) return
    setIsFlightMode(true)
    appendLog("Утка использует «Перелет». Выберите новую свободную клетку.")
  }

  function handleDuckFlight(cell: number) {
    if (!isFlightMode || turn !== "duck") return
    if (!activeCells.includes(cell)) return
    if (shotCells.has(cell)) return
    if (beaverCell === cell) {
      // Flight into beaver is allowed by rules? At L1 artifact doesn't protect, so stepping onto beaver loses immediately
      setDuckCell(cell)
      setIsFlightMode(false)
      endRound({ winner: "hunter", reason: "duck-hit-beaver" })
      return
    }
    setDuckCell(cell)
    setIsFlightMode(false)
    appendLog(`Утка перелетела в клетку ${humanCell(cell)}.`)
    setTurn("hunter")
    setBinocularUsedThisTurn(false)
  }

  function humanCell(i: number) {
    // 3x3: rows A-C, cols 1-3
    const row = String.fromCharCode("A".charCodeAt(0) + Math.floor(i / 3))
    const col = (i % 3) + 1
    return `${row}${col}`
  }

  const canClickCell = useCallback(
    (i: number) => {
      if (!activeCells.includes(i)) return false
      if (turn === "duck-initial") return true
      if (turn === "hunter") return !shotCells.has(i)
      if (turn === "duck" && isFlightMode) {
        return !shotCells.has(i)
      }
      return false
    },
    [activeCells, isFlightMode, shotCells, turn],
  )

  function onCellClick(i: number) {
    if (!canClickCell(i)) return
    if (turn === "duck-initial") handleDuckInitialChoose(i)
    else if (turn === "hunter") handleHunterShoot(i)
    else if (turn === "duck" && isFlightMode) handleDuckFlight(i)
  }

  function newRound() {
    resetRoundState()
  }

  const statusText = useMemo(() => {
    switch (turn) {
      case "pre-bets":
        return "Сделайте ставки и начните раунд."
      case "duck-initial":
        return "Ход Утки: выберите клетку для укрытия."
      case "hunter":
        return "Ход Охотника: выстрелите по клетке. Можно использовать Бинокль до выстрела."
      case "duck":
        return duckHasFlight ? "Ход Утки: остаться или использовать «Перелет»." : "Ход Утки: можно только остаться."
      case "ended":
        if (!outcome) return "Раунд завершен."
        if (outcome.winner === "hunter") return "Победа Охотника!"
        if (outcome.winner === "duck") return "Победа Утки!"
        return "Раунд завершен."
      default:
        return ""
    }
  }, [duckHasFlight, outcome, turn])

  return (
    <main className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Охотник против Утки — Прототип (Уровень 1)</CardTitle>
              <CardDescription>
                Поле 3x3, активны 6 клеток. Утка ходит первой. Бобер прячется в одной активной клетке.
              </CardDescription>
              <div className="mt-2 text-sm">
                <a href="/assets" className="underline text-emerald-700 dark:text-emerald-300">
                  Открыть галерею ассетов
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{statusText}</Badge>
                {turn === "hunter" && (
                  <Badge className="bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200">
                    Патроны: {ammo}
                  </Badge>
                )}
                {duckCell !== null && (turn === "duck" || turn === "hunter") && (
                  <Badge variant="outline">Клетка утки скрыта</Badge>
                )}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                {CELLS.map((i) => {
                  const isActive = activeCells.includes(i)
                  const isShot = shotCells.has(i)
                  const isRevealedEmpty = revealedEmptyByBinoculars.has(i)
                  const showBeaver = turn === "ended" && beaverCell === i // reveal after round

                  const label = humanCell(i)

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onCellClick(i)}
                      className={cn(
                        "relative aspect-square rounded-xl border text-sm sm:text-base transition",
                        isActive ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-muted opacity-50",
                        canClickCell(i) ? "hover:ring-2 hover:ring-emerald-400" : "cursor-not-allowed",
                        isShot && "bg-neutral-200 dark:bg-neutral-800 line-through",
                      )}
                      aria-label={`Клетка ${label}${isActive ? "" : " (недоступна)"}`}
                    >
                      <div className="absolute left-2 top-2 text-xs opacity-60">{label}</div>

                      {isShot && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-neutral-400/40 dark:bg-neutral-700/50 shadow-inner" />
                        </div>
                      )}

                      {isRevealedEmpty && !isShot && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="px-2 py-1 rounded bg-emerald-200 text-emerald-900 text-xs">ПУСТО</div>
                        </div>
                      )}

                      {showBeaver && (
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">{"🦫"}</div>
                      )}

                      {/* Reveal duck only when round ends */}
                      {turn === "ended" && duckCell === i && (
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">{"🦆"}</div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Turn controls */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {turn === "hunter" && (
                  <>
                    <Button
                      variant={hunterHasBinoculars && !binocularUsedThisTurn ? "secondary" : "outline"}
                      onClick={handleBinoculars}
                      disabled={!hunterHasBinoculars || binocularUsedThisTurn}
                    >
                      <Binoculars className="mr-2 h-4 w-4" />
                      Бинокль
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Нажмите на клетку, чтобы выстрелить <Target className="inline-block ml-1 h-4 w-4" />
                    </div>
                  </>
                )}

                {turn === "duck" && (
                  <>
                    <Button variant="secondary" onClick={handleDuckStay}>
                      Затаиться
                    </Button>
                    <Button onClick={startFlightMode} disabled={!duckHasFlight}>
                      <MoveRight className="mr-2 h-4 w-4" />
                      Перелет
                    </Button>
                    {isFlightMode && (
                      <span className="text-sm text-muted-foreground">Выберите новую свободную клетку.</span>
                    )}
                  </>
                )}

                {turn === "ended" && (
                  <Button variant="default" onClick={newRound}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Новый раунд
                  </Button>
                )}
              </div>

              <Separator className="my-4" />

              {/* Bets and round start */}
              {turn === "pre-bets" && (
                <div className="grid gap-3 sm:grid-cols-3 items-end">
                  <div>
                    <div className="mb-1 text-sm font-medium">Ставка Охотника</div>
                    <Input
                      type="number"
                      min={1}
                      max={hunter.gold}
                      value={hunterBet}
                      onChange={(e) => setHunterBet(Number(e.target.value))}
                    />
                    <div className="mt-1 text-xs text-muted-foreground">Баланс: {formatGold(hunter.gold)}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-sm font-medium">Ставка Утки</div>
                    <Input
                      type="number"
                      min={1}
                      max={duck.gold}
                      value={duckBet}
                      onChange={(e) => setDuckBet(Number(e.target.value))}
                    />
                    <div className="mt-1 text-xs text-muted-foreground">Баланс: {formatGold(duck.gold)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="w-full" onClick={startRound}>
                      Начать раунд
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event log */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Журнал событий</CardTitle>
              <CardDescription>Последние ходы и результаты.</CardDescription>
            </CardHeader>
            <CardContent>
              {log.length === 0 ? (
                <div className="text-sm text-muted-foreground">Здесь будут появляться события раунда.</div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {log.map((entry, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-0.5 text-muted-foreground">•</span>
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: balances, shop, rules, art */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Счета и уровни</CardTitle>
              <CardDescription>Экономика и прогресс</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">Охотник</div>
                <div>{formatGold(hunter.gold)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground">Уровень</div>
                <div>Lv. {hunter.level}</div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="font-medium">Утка</div>
                <div>{formatGold(duck.gold)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground">Уровень</div>
                <div>Lv. {duck.level}</div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="font-medium">Банк игры</div>
                <div>{formatGold(bank)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-medium">Бобер</div>
                <div>{formatGold(beaverVault)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Магазин (Уровень 1)</CardTitle>
              <CardDescription>Покупки дают +1 уровень.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">Бинокль (Охотник)</div>
                  <div className="text-muted-foreground">До выстрела случайно покажет пустую клетку.</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{formatGold(SHOP.binocularsCost)}</Badge>
                  <Button
                    size="sm"
                    onClick={buyBinoculars}
                    disabled={hunterHasBinoculars || hunter.gold < SHOP.binocularsCost}
                  >
                    {hunterHasBinoculars ? "Куплено" : "Купить"}
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">Перелет (Утка)</div>
                  <div className="text-muted-foreground">Перемещение на любую свободную клетку.</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{formatGold(SHOP.flightCost)}</Badge>
                  <Button size="sm" onClick={buyFlight} disabled={duckHasFlight || duck.gold < SHOP.flightCost}>
                    {duckHasFlight ? "Куплено" : "Купить"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Правила раунда (Lv.1)
              </CardTitle>
              <CardDescription>Кратко о механике и выплатах</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li>Поле 3x3, активны 6 случайных клеток. Бобер прячется в одной из них.</li>
                <li>Утка ходит первой: выбирает клетку. Попала к Бобру — проигрыш.</li>
                <li>Охотник: 3 патрона. Попал в Утку — победа Охотника. Попал в Бобра — поражение Охотника.</li>
                <li>Промах оставляет воронку — клетка становится недоступной для перелета.</li>
                <li>«Перелет» доступен, если куплен артефакт.</li>
                <li>
                  Выплаты:
                  <ul className="list-disc pl-5">
                    <li>Победа Охотника: 90% от общего банка, 10% в Банк игры.</li>
                    <li>
                      Попадание в Бобра: 50% ставки виновного сопернику, 30% Бобру, 20% Банку. Ставка соперника
                      возвращается.
                    </li>
                    <li>Закончились патроны: Утка забирает весь банк (допущение прототипа).</li>
                  </ul>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Арт-референс</CardTitle>
              <CardDescription>Вдохновляющий стиль и атмосфера</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden rounded-xl border">
                <Image
                  src="/images/duck-arcade.png"
                  alt="Карикатурная сцена охоты на уток у озера: охотник в камышах, летающие утки, интерфейс со счетом и патронами."
                  width={768}
                  height={1152}
                  className="w-full h-auto"
                  priority
                />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Источник добавлен в проект и используется локально.
              </div>
            </CardContent>
          </Card>

          {outcome && (
            <Alert>
              <AlertTitle>
                {outcome.reason === "hunter-shot-duck" && "Победа Охотника"}
                {outcome.reason === "hunter-hit-beaver" && "Охотник попал в Бобра"}
                {outcome.reason === "duck-hit-beaver" && "Утка встретилась с Бобром"}
                {outcome.reason === "hunter-out-of-ammo" && "Патроны закончились"}
              </AlertTitle>
              <AlertDescription>
                {outcome.reason === "hunter-shot-duck" && "Охотник забирает 90% банка. Банк игры берет 10% комиссию."}
                {outcome.reason === "hunter-hit-beaver" &&
                  "Утка получает 50% ставки Охотника, 30% — Бобру, 20% — Банку. Ставка Утки возвращается."}
                {outcome.reason === "duck-hit-beaver" &&
                  "Охотник получает 50% ставки Утки, 30% — Бобру, 20% — Банку. Ставка Охотника возвращается."}
                {outcome.reason === "hunter-out-of-ammo" && "Утка выжила и забирает весь банк (правило прототипа)."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </main>
  )
}
