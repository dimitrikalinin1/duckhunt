"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { useState } from "react"

export default function ReedsDecor({ className }: { className?: string }) {
  const [leftOk, setLeftOk] = useState(true)
  const [rightOk, setRightOk] = useState(true)

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 -bottom-3 sm:-bottom-4 flex items-end justify-between",
        className,
      )}
      style={{ zIndex: 5 }}
    >
      {leftOk && (
        <Image
          src="/images/decor/reeds.png"
          alt="Камыши"
          width={380}
          height={120}
          className="h-16 sm:h-20 md:h-24 w-auto drop-shadow transition-opacity duration-300"
          onError={() => setLeftOk(false)}
        />
      )}
      {rightOk && (
        <Image
          src="/images/decor/reeds.png"
          alt="Камыши"
          width={380}
          height={120}
          className="h-16 sm:h-20 md:h-24 w-auto drop-shadow -scale-x-100 transition-opacity duration-300"
          onError={() => setRightOk(false)}
        />
      )}
    </div>
  )
}
