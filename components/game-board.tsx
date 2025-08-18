"use client"

import { cn } from "@/lib/utils"
import ShotSmoke from "@/components/shot-smoke"
import Image from "next/image"
import { GameIcons } from "@/components/game-icons"

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
      className="grid gap-1 p-4 max-w-lg mx-auto select-none bg-gradient-to-br from-card/50 to-muted/30 rounded-xl border-2 border-border/50 shadow-2xl backdrop-blur-sm"
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
              "relative w-full h-0 pb-[100%] rounded-lg border-2 text-sm transition-all duration-300 overflow-hidden",
              "touch-manipulation select-none box-border min-h-[48px] min-w-[48px]",
              "bg-gradient-to-br from-muted/80 to-card/60 border-border/60 shadow-lg",
              "hover:shadow-xl hover:scale-105 transform-gpu",
              isActive &&
                "from-primary/30 to-secondary/20 border-primary/70 shadow-lg shadow-primary/30 ring-2 ring-primary/50",
              canClick(i) &&
                "hover:border-secondary hover:from-secondary/20 hover:to-primary/10 cursor-pointer hover:shadow-secondary/30",
              !canClick(i) && "cursor-not-allowed opacity-50",
              o.shot &&
                "from-destructive/30 to-destructive/20 border-destructive/70 shadow-lg shadow-destructive/30 ring-2 ring-destructive/50",
              o.compassHint && "ring-2 ring-accent/80 animate-pulse shadow-accent/40",
              o.binocularsUsed &&
                "ring-2 ring-accent/80 from-accent/20 to-accent/10 border-accent/70 shadow-lg shadow-accent/40 animate-glow-pulse",
            )}
            aria-disabled={!canClick(i)}
            onTouchStart={(e) => e.preventDefault()}
            onTouchEnd={(e) => {
              e.preventDefault()
              onCellClick(i)
            }}
          >
            <div className="absolute inset-0">
              {o.shot && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-destructive/40 to-destructive/60 shadow-inner ring-2 ring-destructive/70 animate-pulse" />
                  <div className="absolute text-3xl drop-shadow-lg filter brightness-125">💥</div>
                  <div className="absolute inset-0 bg-destructive/10 rounded-lg animate-ping"></div>
                </div>
              )}

              {o.revealedEmpty && !o.shot && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-black shadow-lg animate-bounce-in border border-primary/30">
                    ПУСТО
                  </div>
                </div>
              )}

              {o.binocularsUsed && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-glow-pulse">
                    <div className="w-8 h-8 drop-shadow-2xl filter brightness-125">
                      <GameIcons.Binoculars />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center animate-spin shadow-lg">
                    <div className="w-4 h-4">
                      <GameIcons.Crosshair />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-accent/10 rounded-lg animate-pulse"></div>
                </div>
              )}

              {o.duck && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-12 h-12 drop-shadow-2xl animate-float-gentle filter brightness-125">
                      <GameIcons.Duck />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-secondary to-primary rounded-full animate-pulse shadow-lg shadow-secondary/60"></div>
                    <div className="absolute inset-0 rounded-full bg-secondary/20 animate-ping"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg"></div>
                  </div>
                </div>
              )}

              {o.eagleEyeDuck && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 drop-shadow-2xl animate-bounce filter brightness-125">
                    <GameIcons.Duck />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-lg animate-pulse"></div>
                </div>
              )}

              {o.beaver && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 drop-shadow-2xl animate-float-gentle filter brightness-125">
                    <GameIcons.Beaver />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/10 rounded-lg animate-pulse"></div>
                </div>
              )}

              {o.warden && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/images/ui/ranger.png"
                    alt="Смотритель"
                    width={48}
                    height={48}
                    className="drop-shadow-lg"
                  />
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

              <div className="absolute top-1 left-1 text-xs text-muted-foreground/60 font-mono font-bold bg-background/20 px-1 rounded backdrop-blur-sm">
                {i + 1}
              </div>

              {canClick(i) && (
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/0 to-primary/0 hover:from-secondary/20 hover:to-primary/10 transition-all duration-300 rounded-lg"></div>
              )}

              {playShotAnim && <ShotSmoke keyId={lastShotAnim!.id} />}
            </div>
          </button>
        )
      })}
    </div>
  )
}
