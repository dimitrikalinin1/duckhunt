"use client"

import { cn } from "@/lib/utils"
import ShotSmoke from "@/components/shot-smoke"
import Image from "next/image"

export type CellOverlay = {
  beaver?: boolean
  warden?: boolean
  duck?: boolean
  shot?: boolean
  revealedEmpty?: boolean
  trap?: boolean
  compassHint?: boolean
  eagleEyeDuck?: boolean // L4 Орлиный глаз — подсветка утки в начале
  binocularsUsed?: boolean // добавлен тип для клеток где использовался бинокль
}

type Props = {
  rows: number
  cols: number
  activeCells: number[]
  overlays: Record<number, CellOverlay>
  lastShotAnim?: { cell: number; id: number } | null
  canClick: (idx: number) => boolean
  onCellClick: (idx: number) => void
}

export default function GameBoard({ rows, cols, activeCells, overlays, lastShotAnim, canClick, onCellClick }: Props) {
  const total = rows * cols
  const indices = Array.from({ length: total }, (_, i) => i)

  return (
    <div
      role="grid"
      aria-label="Игровое поле"
      className="grid gap-1 p-2 max-w-sm mx-auto"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {indices.map((i) => {
        const isActive = activeCells.includes(i)
        const o = overlays[i] || {}
        const playShotAnim = lastShotAnim && lastShotAnim.cell === i

        return (
          <button
            key={i}
            type="button"
            role="gridcell"
            onClick={() => onCellClick(i)}
            className={cn(
              "relative aspect-square rounded-lg border-2 text-sm transition-colors duration-200 overflow-hidden touch-manipulation",
              "bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600",
              isActive && "from-emerald-800/50 to-green-800/50 border-emerald-500/50 shadow-lg shadow-emerald-500/20",
              canClick(i) &&
                "hover:border-cyan-400 hover:from-cyan-800/30 hover:to-blue-800/30 cursor-pointer active:scale-95",
              !canClick(i) && "cursor-not-allowed opacity-60",
              o.shot && "from-red-900/30 to-red-800/30 border-red-500/50 shadow-lg shadow-red-500/20",
              o.compassHint && "ring-2 ring-amber-400/70 animate-pulse",
              o.binocularsUsed &&
                "ring-2 ring-yellow-400/80 from-yellow-900/30 to-yellow-800/30 border-yellow-500/50 shadow-lg shadow-yellow-500/30 animate-pulse",
            )}
            aria-disabled={!canClick(i)}
          >
            {o.shot && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500/30 to-red-700/30 shadow-inner ring-2 ring-red-400/50 animate-pulse" />
                <div className="absolute text-2xl">💥</div>
              </div>
            )}

            {o.revealedEmpty && !o.shot && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold shadow-lg animate-bounce-in">
                  ПУСТО
                </div>
              </div>
            )}

            {o.binocularsUsed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse">
                  <div className="text-4xl drop-shadow-lg filter brightness-110">👁</div>
                </div>
                <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-xs font-bold animate-spin">
                  🔍
                </div>
              </div>
            )}

            {o.duck && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="text-5xl drop-shadow-2xl animate-float filter brightness-110">🦆</div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                  <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping"></div>
                </div>
              </div>
            )}

            {/* Легендарный подсвет "утки" (одноразовый эффект) */}
            {o.eagleEyeDuck && (
              <div className="absolute inset-0 flex items-center justify-center text-4xl drop-shadow-2xl animate-bounce">
                🦆
              </div>
            )}

            {o.beaver && (
              <div className="absolute inset-0 flex items-center justify-center text-4xl drop-shadow-2xl animate-float">
                🦫
              </div>
            )}
            {o.warden && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Image src="/images/ui/ranger.png" alt="Смотритель" width={48} height={48} className="drop-shadow-lg" />
              </div>
            )}
            {o.trap && (
              <div className="absolute right-2 bottom-2">
                <Image
                  src="/images/ui/trap.png"
                  alt="Капкан"
                  width={24}
                  height={24}
                  className="drop-shadow-lg animate-pulse"
                />
              </div>
            )}

            <div className="absolute top-1 left-1 text-xs text-slate-400 font-mono opacity-50">{i + 1}</div>

            {canClick(i) && (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 to-blue-400/0 group-hover:from-cyan-400/20 group-hover:to-blue-400/20 transition-all duration-300 rounded-lg"></div>
            )}

            {playShotAnim && <ShotSmoke keyId={lastShotAnim!.id} />}
          </button>
        )
      })}
    </div>
  )
}
