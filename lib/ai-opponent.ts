export type PlayerCharacter = "hunter" | "duck"

export type AIMove = {
  type: "move" | "stay" | "shoot" | "use-ability"
  target?: number
  ability?: string
}

export type GameContext = {
  activeCells: number[]
  shotCells: number[]
  playerCell: number | null
  beaverCell: number | null
  wardenCell: number | null
  level: number
  ammo: number
  duckSnaredTurns?: number
  compassHint?: number[]
  playerArtifacts?: {
    hunter?: {
      binoculars: boolean
      trap: boolean
      apBullet: number
      eagleEye: boolean
    }
    duck?: {
      flight: boolean
      safeFlight: boolean
      armoredFeatherRank: number
      mirrorPlumage: boolean
      autoFlight: boolean
      rain: boolean
      ghostFlight: boolean
    }
  }
}

export function createAI(character: PlayerCharacter) {
  return {
    async makeMove(context: GameContext): Promise<AIMove> {
      console.log(`AI ${character} making a move with context:`, context)

      // Всегда используем простую логику для стабильности
      if (character === "duck") {
        return makeSimpleDuckMove(context)
      } else {
        return makeSimpleHunterMove(context)
      }
    },
  }
}

// Улучшенная простая логика для утки
function makeSimpleDuckMove(context: GameContext): AIMove {
  const { activeCells, shotCells, beaverCell, wardenCell, duckSnaredTurns, playerArtifacts } = context

  console.log("AI Duck making simple move...")

  if (duckSnaredTurns && duckSnaredTurns > 0) {
    console.log("Duck is snared, staying")
    return { type: "stay" }
  }

  // Используем дождь с 25% вероятностью если доступен
  if (playerArtifacts?.duck?.rain && Math.random() < 0.25) {
    console.log("Duck using rain ability")
    return { type: "use-ability", ability: "rain" }
  }

  // Используем безопасный перелет с 35% вероятностью если доступен
  if (playerArtifacts?.duck?.safeFlight && Math.random() < 0.35) {
    console.log("Duck using safe flight")
    return { type: "use-ability", ability: "safeFlight" }
  }

  // Если есть обычный перелет, ищем безопасные клетки
  if (playerArtifacts?.duck?.flight) {
    const safeCells = activeCells.filter((cell) => {
      const notShot = !shotCells.includes(cell)
      const notNPC = cell !== beaverCell && cell !== wardenCell
      const notCurrentPosition = cell !== context.playerCell
      return notShot && notNPC && notCurrentPosition
    })

    if (safeCells.length > 0 && Math.random() < 0.6) {
      const targetCell = sample(safeCells)
      console.log(`Duck flying to cell ${targetCell}`)
      return { type: "move", target: targetCell }
    }
  }

  console.log("Duck staying in place")
  return { type: "stay" }
}

// Улучшенная простая логика для охотника
function makeSimpleHunterMove(context: GameContext): AIMove {
  const { activeCells, shotCells, playerCell, beaverCell, wardenCell, playerArtifacts, ammo } = context

  console.log("AI Hunter making simple move...")

  // Если знаем точное местоположение утки, стреляем туда
  if (playerCell !== null && !shotCells.includes(playerCell)) {
    console.log(`Hunter shooting at known duck position: ${playerCell}`)
    return { type: "shoot", target: playerCell }
  }

  // Используем бинокль с 50% вероятностью если доступен и у нас больше 1 патрона
  if (playerArtifacts?.hunter?.binoculars && ammo > 1 && Math.random() < 0.5) {
    console.log("Hunter using binoculars")
    return { type: "use-ability", ability: "binoculars" }
  }

  // Выбираем клетку для выстрела, избегая NPC
  const availableCells = activeCells.filter(
    (cell) => !shotCells.includes(cell) && cell !== beaverCell && cell !== wardenCell,
  )

  if (availableCells.length > 0) {
    // Предпочитаем клетки, которые не были обстреляны
    const targetCell = sample(availableCells)
    console.log(`Hunter shooting at cell ${targetCell}`)
    return { type: "shoot", target: targetCell }
  }

  // Если нет хороших вариантов, стреляем в любую доступную клетку (кроме NPC)
  const lastResortCells = activeCells.filter(
    (cell) => !shotCells.includes(cell) && cell !== beaverCell && cell !== wardenCell,
  )

  if (lastResortCells.length > 0) {
    const randomCell = sample(lastResortCells)
    console.log(`Hunter shooting at last resort cell ${randomCell}`)
    return { type: "shoot", target: randomCell }
  }

  // Крайний случай - стреляем в любую не обстрелянную клетку
  const anyCell = activeCells.find((cell) => !shotCells.includes(cell))
  if (anyCell !== undefined) {
    console.log(`Hunter shooting at any available cell ${anyCell}`)
    return { type: "shoot", target: anyCell }
  }

  // Если вообще нет вариантов, используем бинокль если есть
  if (playerArtifacts?.hunter?.binoculars) {
    console.log("Hunter using binoculars as last resort")
    return { type: "use-ability", ability: "binoculars" }
  }

  // Совсем крайний случай - стреляем в первую активную клетку
  console.log(`Hunter shooting at first active cell ${activeCells[0]}`)
  return { type: "shoot", target: activeCells[0] }
}

function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
