"use client"

import Image from "next/image"
import ThemeToggle from "./theme-toggle"

export default function AppHeader() {
  return (
    <header className="sticky top-3 z-50 mx-auto max-w-6xl px-3">
      <div className="flex items-center justify-between rounded-2xl border bg-white/70 px-3 py-2 shadow-sm backdrop-blur-md dark:bg-black/35">
        <div className="flex items-center gap-3">
          <Image src="/images/emoji/duck-happy.png" alt="Duck Hunt" width={28} height={28} className="rounded" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              {"Охотник "}
              <span className="text-emerald-700 dark:text-emerald-300">{"vs"}</span>
              {" Утка"}
            </span>
            <span className="text-[11px] text-muted-foreground">{"Тактический 3x3 прототип"}</span>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
