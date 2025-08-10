export type LevelKey = 1 | 2 | 3 | 4

export type LevelRules = {
  key: LevelKey
  name: string
  rows: number
  cols: number
  activeCellCount?: number // если не задано — все клетки активны
  ammo: number
  hasBeaver: boolean
  hasWarden?: boolean
}

export const LEVELS: Record<LevelKey, LevelRules> = {
  1: {
    key: 1,
    name: "Лесная опушка",
    rows: 2, // было 3
    cols: 3, // было 2
    ammo: 3,
    hasBeaver: true,
  },
  2: {
    key: 2,
    name: "Старое болото",
    rows: 3,
    cols: 3,
    ammo: 3,
    hasBeaver: true,
  },
  3: {
    key: 3,
    name: "Горное озеро",
    rows: 3,
    cols: 3,
    ammo: 4, // +1 патрон на контрбаланс
    hasBeaver: true,
  },
  4: {
    key: 4,
    name: "Заповедник",
    rows: 4, // 4 ряда
    cols: 3, // по 3 клетки в ряду = 12 клеток
    ammo: 4,
    hasBeaver: true,
    hasWarden: true,
  },
}

export function gridSize(level: LevelRules) {
  return level.rows * level.cols
}
