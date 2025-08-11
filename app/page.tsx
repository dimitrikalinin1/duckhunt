"use client"

import { useState } from "react"
import SceneBackground from "@/components/scene-background"
import AppHeader from "@/components/app-header"
import CharacterSelect from "@/components/character-select"
import GameSession from "@/components/game-session"
import type { PlayerCharacter } from "@/lib/ai-opponent"

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
  const [selectedCharacter, setSelectedCharacter] = useState<PlayerCharacter | null>(null)

  const handleBackToMenu = () => {
    setSelectedCharacter(null)
  }

  return (
    <SceneBackground
      src={selectedCharacter ? "/images/backgrounds/forest-edge.png" : "/images/backgrounds/forest-edge.png"}
    >
      <AppHeader />
      {selectedCharacter ? (
        <GameSession playerCharacter={selectedCharacter} onBackToMenu={handleBackToMenu} />
      ) : (
        <CharacterSelect onSelect={setSelectedCharacter} />
      )}
    </SceneBackground>
  )
}

export type { PlayerCharacter }
