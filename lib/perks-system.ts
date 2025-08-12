export type PerkType = "binoculars" | "armored-feather"

export type HunterPerk = {
  id: "binoculars"
  name: "Бинокль"
  description: "Подсвечивает 1 клетку где нет утки. 1 раз на уровень. +1 уровень персонажу."
  cost: 30
  levelBonus: 1
  usesPerLevel: 1
}

export type DuckPerk = {
  id: "armored-feather"
  name: "Бронированное перо"
  description: "Сохраняет часть ставки при проигрыше"
  ranks: {
    1: { cost: 40; protection: 5; levelBonus: 1 }
    2: { cost: 80; protection: 10; levelBonus: 1 }
    3: { cost: 120; protection: 15; levelBonus: 1 }
  }
}

export type PlayerLevels = {
  hunter: number
  duck: number
}

export const HUNTER_PERKS: Record<string, HunterPerk> = {
  binoculars: {
    id: "binoculars",
    name: "Бинокль",
    description: "Подсвечивает 1 клетку где нет утки. 1 раз на уровень. +1 уровень персонажу.",
    cost: 30,
    levelBonus: 1,
    usesPerLevel: 1,
  },
}

export const DUCK_PERKS: Record<string, DuckPerk> = {
  "armored-feather": {
    id: "armored-feather",
    name: "Бронированное перо",
    description: "Сохраняет часть ставки при проигрыше",
    ranks: {
      1: { cost: 40, protection: 5, levelBonus: 1 },
      2: { cost: 80, protection: 10, levelBonus: 1 },
      3: { cost: 120, protection: 15, levelBonus: 1 },
    },
  },
}

export function calculateArmoredFeatherProtection(rank: number): number {
  const perk = DUCK_PERKS["armored-feather"]
  if (rank >= 1 && rank <= 3) {
    return perk.ranks[rank as 1 | 2 | 3].protection
  }
  return 0
}

export function getNextArmoredFeatherCost(currentRank: number): number | null {
  const perk = DUCK_PERKS["armored-feather"]
  const nextRank = currentRank + 1
  if (nextRank >= 1 && nextRank <= 3) {
    return perk.ranks[nextRank as 1 | 2 | 3].cost
  }
  return null
}

export function canUpgradeArmoredFeather(currentRank: number): boolean {
  return currentRank < 3
}

export function getBinocularsCost(): number {
  return HUNTER_PERKS.binoculars.cost
}
