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
      className="grid gap-2 sm:gap-3 md:gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
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
              "relative aspect-square rounded-xl border text-sm transition-transform duration-150 transform-gpu overflow-hidden",
              isActive ? "bg-emerald-50/80 dark:bg-emerald-950/50" : "bg-muted/70 opacity-60",
              canClick(i)
                ? "hover:scale-[1.04] hover:shadow-md hover:ring-2 hover:ring-emerald-400"
                : "cursor-not-allowed",
              o.shot && "bg-neutral-200/80 dark:bg-neutral-800/70 line-through",
              o.compassHint && "ring-2 ring-amber-400/70",
            )}
            aria-disabled={!canClick(i)}
          >
            {/* Композиционные оверлеи */}
            {o.shot && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-neutral-400/30 dark:bg-neutral-700/40 shadow-inner ring-1 ring-black/10" />
              </div>
            )}

            {o.revealedEmpty && !o.shot && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="px-2 py-1 rounded bg-emerald-200 text-emerald-900 text-xs">{"ПУСТО"}</div>
              </div>
            )}

            {/* Легендарный подсвет "утки" (одноразовый эффект) */}
            {o.eagleEyeDuck && (
              <div className="absolute inset-0 flex items-center justify-center text-3xl drop-shadow">{"🦆"}</div>
            )}

            {/* Показываем НПС при конце/раскрытии */}
            {o.beaver && <div className="absolute inset-0 flex items-center justify-center text-3xl">{"🦫"}</div>}
            {o.warden && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Image src="/images/ui/ranger.png" alt="Смотритель" width={36} height={36} />
              </div>
            )}
            {o.trap && (
              <div className="absolute right-1 bottom-1">
                <Image src="/images/ui/trap.png" alt="Капкан" width={20} height={20} />
              </div>
            )}

            {playShotAnim && <ShotSmoke keyId={lastShotAnim!.id} />}
          </button>
        )
      })}
    </div>
  )
}
