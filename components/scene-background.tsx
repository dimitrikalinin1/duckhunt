"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

type Props = {
  src?: string
  className?: string
  overlayClassName?: string
  children: ReactNode
}

export default function SceneBackground({
  src = "/images/backgrounds/forest-edge.png",
  className,
  overlayClassName,
  children,
}: Props) {
  return (
    <div className={cn("relative min-h-dvh w-full", className)}>
      <Image
        src={src || "/placeholder.svg"}
        alt="Игровой фон"
        fill
        priority
        className="object-cover [transform:translateZ(0)]"
      />
      {/* Soft tint and readability layer */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-100/65 via-emerald-50/40 to-white/85 dark:from-emerald-950/70 dark:via-emerald-900/30 dark:to-black/80",
          overlayClassName,
        )}
      />
      {/* Content layer */}
      <div className="relative">{children}</div>
    </div>
  )
}
