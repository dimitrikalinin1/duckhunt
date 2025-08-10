"use client"

import Image from "next/image"

type FeatherBurstProps = {
  show: boolean
}

const FEATHERS = Array.from({ length: 10 }, (_, i) => i)

export default function FeatherBurst({ show }: FeatherBurstProps) {
  if (!show) return null
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 10 }}>
      {FEATHERS.map((i) => {
        const delay = `${i * 60}ms`
        const left = `${10 + i * 8}%`
        const size = i % 3 === 0 ? 28 : i % 3 === 1 ? 22 : 18
        return (
          <div key={i} className="absolute -top-3 animate-feather" style={{ left, animationDelay: delay }}>
            <Image
              src="/images/emoji/feather.png"
              alt="Перо"
              width={size}
              height={size}
              className="opacity-90 drop-shadow"
            />
          </div>
        )
      })}
    </div>
  )
}
