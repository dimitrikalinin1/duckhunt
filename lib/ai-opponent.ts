import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

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

      try {
        if (character === "duck") {
          return await makeAIDuckMove(context)
        } else {
          return await makeAIHunterMove(context)
        }
      } catch (error) {
        console.error("AI move generation failed, falling back to simple logic:", error)
        // Fallback to simple logic if AI fails
        if (character === "duck") {
          return makeSimpleDuckMove(context)
        } else {
          return makeSimpleHunterMove(context)
        }
      }
    },
  }
}

async function makeAIDuckMove(context: GameContext): Promise<AIMove> {
  const { activeCells, shotCells, beaverCell, wardenCell, duckSnaredTurns, playerArtifacts } = context

  // Если утка в капкане, остается на месте
  if (duckSnaredTurns && duckSnaredTurns > 0) {
    console.log("AI Duck is snared, staying in place")
    return { type: "stay" }
  }

  const prompt = `Ты играешь за умную утку в тактической игре "Охотник vs Утка". 

ТЕКУЩАЯ СИТУАЦИЯ:
- Активные клетки: ${activeCells.join(", ")}
- Обстрелянные клетки: ${shotCells.join(", ")}
- Бобер находится в клетке: ${beaverCell}
- Смотритель находится в клетке: ${wardenCell || "отсутствует"}
- Твоя текущая позиция: ${context.playerCell}
- Уровень: ${context.level}

ТВОИ СПОСОБНОСТИ:
${playerArtifacts?.duck?.flight ? "- Перелет: можешь переместиться на любую клетку" : ""}
${playerArtifacts?.duck?.safeFlight ? "- Безопасный перелет: автоматически выбирает безопасную клетку" : ""}
${playerArtifacts?.duck?.rain ? "- Дождь: снижает выигрыш охотника на 30%" : ""}
${playerArtifacts?.duck?.ghostFlight ? "- Призрачный перелет: можешь лететь на обстрелянные клетки" : ""}
${playerArtifacts?.duck?.armoredFeatherRank ? `- Бронированное перо ранг ${playerArtifacts.duck.armoredFeatherRank}: защита от потерь` : ""}

ПРАВИЛА:
- Избегай клетки с бобром (${beaverCell}) и смотрителем (${wardenCell})
- Не лети на обстрелянные клетки (кроме призрачного перелета)
- Используй способности стратегически

Выбери ОДНО действие:
1. "stay" - остаться на месте
2. "move X" - переместиться на клетку X (только если есть перелет)
3. "use-ability rain" - использовать дождь (если доступен)
4. "use-ability safeFlight" - использовать безопасный перелет

Ответь только номером действия и параметрами, например: "move 3" или "stay" или "use-ability rain"`

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
    maxTokens: 50,
  })

  console.log("AI Duck response:", text)

  // Парсим ответ ИИ
  const response = text.toLowerCase().trim()

  if (response.includes("stay")) {
    return { type: "stay" }
  }

  if (response.includes("move")) {
    const match = response.match(/move\s+(\d+)/)
    if (match) {
      const target = Number.parseInt(match[1])
      if (activeCells.includes(target)) {
        return { type: "move", target }
      }
    }
  }

  if (response.includes("rain")) {
    return { type: "use-ability", ability: "rain" }
  }

  if (response.includes("safeflight")) {
    return { type: "use-ability", ability: "safeFlight" }
  }

  // Fallback to simple logic
  return makeSimpleDuckMove(context)
}

async function makeAIHunterMove(context: GameContext): Promise<AIMove> {
  const { activeCells, shotCells, playerCell, beaverCell, wardenCell, ammo, playerArtifacts } = context

  const prompt = `Ты играешь за опытного охотника в тактической игре "Охотник vs Утка".

ТЕКУЩАЯ СИТУАЦИЯ:
- Активные клетки: ${activeCells.join(", ")}
- Обстрелянные клетки: ${shotCells.join(", ")}
- Утка находится в клетке: ${playerCell || "неизвестно"}
- Бобер находится в клетке: ${beaverCell}
- Смотритель находится в клетке: ${wardenCell || "отсутствует"}
- Патронов осталось: ${ammo}
- Уровень: ${context.level}

ТВОИ СПОСОБНОСТИ:
${playerArtifacts?.hunter?.binoculars ? "- Бинокль: показывает пустые клетки" : ""}
${playerArtifacts?.hunter?.trap ? "- Капкан: обездвиживает утку" : ""}
${playerArtifacts?.hunter?.apBullet ? `- Бронебойные патроны: ${playerArtifacts.hunter.apBullet} шт.` : ""}
${playerArtifacts?.hunter?.eagleEye ? "- Орлиный глаз: показывает утку в начале" : ""}

ПРАВИЛА:
- НЕ стреляй в бобра (${beaverCell}) - проиграешь!
- НЕ стреляй в смотрителя (${wardenCell}) - штраф!
- Если знаешь где утка (${playerCell}) - стреляй туда
- Используй бинокль для разведки
- Экономь патроны

Выбери ОДНО действие:
1. "shoot X" - выстрелить в клетку X
2. "use-ability binoculars" - использовать бинокль

Ответь только действием, например: "shoot 3" или "use-ability binoculars"`

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
    maxTokens: 50,
  })

  console.log("AI Hunter response:", text)

  // Парсим ответ ИИ
  const response = text.toLowerCase().trim()

  if (response.includes("shoot")) {
    const match = response.match(/shoot\s+(\d+)/)
    if (match) {
      const target = Number.parseInt(match[1])
      if (activeCells.includes(target) && !shotCells.includes(target)) {
        return { type: "shoot", target }
      }
    }
  }

  if (response.includes("binoculars")) {
    return { type: "use-ability", ability: "binoculars" }
  }

  // Fallback to simple logic
  return makeSimpleHunterMove(context)
}

// Простая логика как fallback
function makeSimpleDuckMove(context: GameContext): AIMove {
  const { activeCells, shotCells, beaverCell, wardenCell, duckSnaredTurns, playerArtifacts } = context

  if (duckSnaredTurns && duckSnaredTurns > 0) {
    return { type: "stay" }
  }

  // Используем дождь с 30% вероятностью
  if (playerArtifacts?.duck?.rain && Math.random() < 0.3) {
    return { type: "use-ability", ability: "rain" }
  }

  // Используем безопасный перелет с 40% вероятностью
  if (playerArtifacts?.duck?.safeFlight && Math.random() < 0.4) {
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

    if (safeCells.length > 0) {
      const targetCell = sample(safeCells)
      return { type: "move", target: targetCell }
    }
  }

  return { type: "stay" }
}

function makeSimpleHunterMove(context: GameContext): AIMove {
  const { activeCells, shotCells, playerCell, beaverCell, wardenCell, playerArtifacts } = context

  // Если знаем точное местоположение утки, стреляем туда
  if (playerCell !== null && !shotCells.includes(playerCell)) {
    return { type: "shoot", target: playerCell }
  }

  // Используем бинокль с 60% вероятностью
  if (playerArtifacts?.hunter?.binoculars && Math.random() < 0.6) {
    return { type: "use-ability", ability: "binoculars" }
  }

  // Выбираем клетку для выстрела
  const availableCells = activeCells.filter(
    (cell) => !shotCells.includes(cell) && cell !== beaverCell && cell !== wardenCell,
  )

  if (availableCells.length > 0) {
    const targetCell = sample(availableCells)
    return { type: "shoot", target: targetCell }
  }

  // Если нет хороших вариантов, стреляем в любую доступную клетку
  const randomCell = sample(activeCells.filter((cell) => !shotCells.includes(cell)))
  return { type: "shoot", target: randomCell }
}

function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
