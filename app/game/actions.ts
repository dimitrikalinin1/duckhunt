"use server"

import { getGameState, updateGameState, createInitialGameState } from "@/lib/game-state"
import { LEVELS, gridSize } from "@/lib/game-config"
import { calculateArmoredFeatherProtection } from "@/lib/perks-system"
import { updatePlayerExperience, updatePlayerCoins, saveGameToHistory } from "@/lib/player-service"
import { getLobby } from "@/lib/lobby-store"

// Вспомогательные функции
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

export async function initializeGame(lobbyId: string) {
  const state = createInitialGameState(lobbyId)

  const lobby = getLobby(lobbyId)
  let hunterPlayerId: string | undefined
  let duckPlayerId: string | undefined

  if (lobby) {
    for (const player of lobby.players) {
      if (player.role === "hunter") {
        hunterPlayerId = player.id
      } else if (player.role === "duck") {
        duckPlayerId = player.id
      }
    }

    // Save initial game session to database
    if (hunterPlayerId && duckPlayerId) {
      console.log("[v0] Creating game session in database:", {
        sessionId: state.sessionId,
        lobbyId,
        hunterPlayerId,
        duckPlayerId,
      })

      await saveGameToHistory({
        sessionId: state.sessionId,
        lobbyId,
        hunterPlayerId,
        duckPlayerId,
        winner: "hunter", // Temporary, will be updated when game ends
        reason: "running",
        hunterBet: state.hunterBet,
        duckBet: state.duckBet,
        hunterCoinsChange: 0,
        duckCoinsChange: 0,
        hunterExperienceGained: 0,
        duckExperienceGained: 0,
        shotsFired: 0,
        movesMade: 0,
        durationSeconds: 0,
      })
    }
  }

  // Сразу запускаем раунд для мультиплеера
  const level = LEVELS[state.level]
  const total = gridSize(level)
  const all = Array.from({ length: total }, (_, i) => i)
  const activeCells =
    level.activeCellCount && level.activeCellCount < total
      ? getRandomIndices(level.activeCellCount, all).sort((a, b) => a - b)
      : all

  const beaverCell = sample(activeCells)
  let wardenCell = null
  if (level.hasWarden) {
    let w = sample(activeCells)
    while (w === beaverCell) w = sample(activeCells)
    wardenCell = w
  }

  let compassHint = []
  if (state.level >= 2 && state.inventory.hunter.compass) {
    const others = activeCells.filter((c) => c !== beaverCell)
    compassHint = [beaverCell, ...getRandomIndices(2, others)]
  }

  const initializedState = updateGameState(lobbyId, {
    ...state,
    activeCells,
    beaverCell,
    wardenCell,
    compassHint,
    ammo: level.ammo + (state.inventory.hunter.extraAmmo || 0),
    turn: "duck-initial",
    lastAction: {
      type: "game-initialized",
      playerId: "system",
      data: { level: state.level },
      timestamp: Date.now(),
    },
  })

  return { success: true, state: initializedState }
}

export async function getGameStateAction(lobbyId: string) {
  const state = getGameState(lobbyId)
  return { success: true, state }
}

// Безопасный первый ход утки
export async function makeDuckInitialMove(lobbyId: string, playerId: string, cellIndex?: number) {
  const currentState = getGameState(lobbyId)
  if (!currentState || currentState.turn !== "duck-initial") {
    return { success: false, error: "Invalid game state" }
  }

  const availableCells = currentState.activeCells

  if (availableCells.length === 0) {
    return { success: false, error: "No cells available" }
  }

  let duckCell: number
  if (cellIndex !== undefined && availableCells.includes(cellIndex)) {
    duckCell = cellIndex
  } else {
    // Выбираем случайную клетку (может быть бобр)
    duckCell = sample(availableCells)
  }

  let outcome = null
  if (duckCell === currentState.beaverCell) {
    outcome = { winner: "hunter", reason: "duck-hit-beaver" }
  } else if (duckCell === currentState.wardenCell) {
    outcome = { winner: "hunter", reason: "duck-hit-warden" }
  }

  // Проверяем капкан
  let duckSnaredTurns = 0
  if (currentState.inventory.hunter.trapPlaced === duckCell) {
    duckSnaredTurns = 1
  }

  // Обновляем состояние игры
  const updatedState = updateGameState(lobbyId, {
    duckCell,
    duckSnaredTurns,
    turn: outcome ? "ended" : "hunter",
    outcome,
    binocularUsedThisTurn: false,
    lastAction: {
      type: "duck-initial-move",
      playerId,
      data: { cell: duckCell, trapped: duckSnaredTurns > 0, hitNPC: !!outcome },
      timestamp: Date.now(),
    },
  })

  return { success: true, state: updatedState }
}

export async function makeHunterShot(lobbyId: string, playerId: string, cell: number, useAPBullet = false) {
  const currentState = getGameState(lobbyId)
  if (!currentState || currentState.turn !== "hunter") {
    return { success: false, error: "Not hunter's turn" }
  }

  if (!currentState.activeCells.includes(cell) || currentState.shotCells.includes(cell)) {
    return { success: false, error: "Invalid cell" }
  }

  let outcome = null
  let nextTurn = "duck"
  const newAmmo = currentState.ammo - 1
  const newShotCells = [...currentState.shotCells, cell]
  let hit = false

  // Обновляем инвентарь если используется бронебойная пуля
  let newInventory = currentState.inventory
  if (useAPBullet && currentState.inventory.hunter.apBullet > 0) {
    newInventory = {
      ...currentState.inventory,
      hunter: {
        ...currentState.inventory.hunter,
        apBullet: currentState.inventory.hunter.apBullet - 1,
      },
    }
  }

  // Проверяем попадание
  if (currentState.wardenCell === cell) {
    outcome = { winner: "duck", reason: "hunter-hit-warden" }
    nextTurn = "ended"
    hit = true
  } else if (currentState.beaverCell === cell) {
    outcome = { winner: "duck", reason: "hunter-hit-beaver" }
    nextTurn = "ended"
    hit = true
  } else if (currentState.duckCell === cell) {
    // Проверяем защиты утки
    const isAP = useAPBullet && currentState.inventory.hunter.apBullet > 0

    // Mirror plumage protection
    if (!isAP && currentState.inventory.duck.mirrorPlumage && !currentState.inventory.duck.mirrorUsed) {
      newInventory = {
        ...newInventory,
        duck: { ...newInventory.duck, mirrorUsed: true },
      }

      // 10% шанс отразить в охотника
      if (Math.random() < 0.1) {
        outcome = { winner: "duck", reason: "hunter-hit-beaver" }
        nextTurn = "ended"
        hit = true
      } else {
        // Отражаем в случайную клетку
        const freeCells = currentState.activeCells.filter((c) => !newShotCells.includes(c) && c !== cell)
        if (freeCells.length > 0) {
          const reflectTarget = sample(freeCells)
          newShotCells.push(reflectTarget)
        }
        hit = false
        if (newAmmo <= 0) {
          outcome = { winner: "duck", reason: "hunter-out-of-ammo" }
          nextTurn = "ended"
        }
      }
    }
    // Auto flight protection
    else if (!isAP && currentState.inventory.duck.autoFlight && !currentState.inventory.duck.autoFlightUsed) {
      const validCells = currentState.activeCells.filter(
        (c) =>
          c !== currentState.beaverCell && c !== currentState.wardenCell && !newShotCells.includes(c) && c !== cell,
      )
      if (validCells.length >= 1) {
        newInventory = {
          ...newInventory,
          duck: { ...newInventory.duck, autoFlightUsed: true },
        }
        const newDuckCell = sample(validCells)

        const updatedState = updateGameState(lobbyId, {
          shotCells: newShotCells,
          ammo: newAmmo,
          duckCell: newDuckCell,
          inventory: newInventory,
          turn: newAmmo <= 0 ? "ended" : "duck",
          outcome: newAmmo <= 0 ? { winner: "duck", reason: "hunter-out-of-ammo" } : null,
          binocularUsedThisTurn: false,
          lastAction: {
            type: "hunter-shot",
            playerId,
            data: { cell, hit: false, autoFlight: true, newDuckCell },
            timestamp: Date.now(),
          },
        })

        // Автоматическое завершение игры с начислением опыта при окончании патронов
        if (newAmmo <= 0) {
          await endGameWithOutcome(lobbyId, { winner: "duck", reason: "hunter-out-of-ammo" }, playerId, undefined)
        }

        return { success: true, state: updatedState }
      } else {
        outcome = { winner: "hunter", reason: "hunter-shot-duck" }
        nextTurn = "ended"
        hit = true
      }
    } else {
      outcome = { winner: "hunter", reason: "hunter-shot-duck" }
      nextTurn = "ended"
      hit = true
    }
  } else if (newAmmo <= 0) {
    outcome = { winner: "duck", reason: "hunter-out-of-ammo" }
    nextTurn = "ended"
  }

  // Обновляем состояние игры
  const updatedState = updateGameState(lobbyId, {
    shotCells: newShotCells,
    ammo: newAmmo,
    inventory: newInventory,
    turn: nextTurn,
    outcome,
    binocularUsedThisTurn: false,
    lastAction: {
      type: "hunter-shot",
      playerId,
      data: { cell, hit, useAPBullet },
      timestamp: Date.now(),
    },
  })

  // Автоматическое завершение игры с начислением опыта при окончании игры
  if (outcome) {
    await endGameWithOutcome(lobbyId, outcome, playerId, undefined)
  }

  return { success: true, state: updatedState }
}

export async function makeDuckMove(lobbyId: string, playerId: string, action: "stay" | "flight", targetCell?: number) {
  const currentState = getGameState(lobbyId)
  if (!currentState || currentState.turn !== "duck") {
    return { success: false, error: "Not duck's turn" }
  }

  let newDuckCell = currentState.duckCell
  let outcome = null
  let newDuckSnaredTurns = Math.max(0, (currentState.duckSnaredTurns || 0) - 1)
  const newNotifications = [...(currentState.notifications || [])]

  if (action === "flight" && targetCell !== undefined) {
    // Проверяем валидность клетки для перелета
    if (!currentState.activeCells.includes(targetCell)) {
      return { success: false, error: "Invalid cell" }
    }

    if (currentState.shotCells.includes(targetCell) && !currentState.inventory.duck.ghostFlight) {
      return { success: false, error: "Утка не может лететь в обстрелянную клетку" }
    }

    if ((currentState.binocularsUsedCells || []).includes(targetCell)) {
      return { success: false, error: "Утка не может лететь туда, где использовался бинокль" }
    }

    newNotifications.push("🦆 Утка перелетела, но куда?")

    // Проверяем попадание на NPC
    if (currentState.wardenCell === targetCell) {
      outcome = { winner: "hunter", reason: "duck-hit-warden" }
      newDuckCell = targetCell
    } else if (currentState.beaverCell === targetCell) {
      outcome = { winner: "hunter", reason: "duck-hit-beaver" }
      newDuckCell = targetCell
    } else {
      newDuckCell = targetCell
    }

    // Проверяем капкан
    if (currentState.inventory.hunter.trapPlaced === targetCell) {
      newDuckSnaredTurns = 1
    }
  }

  // Обновляем состояние игры
  const updatedState = updateGameState(lobbyId, {
    duckCell: newDuckCell,
    duckSnaredTurns: newDuckSnaredTurns,
    notifications: newNotifications,
    turn: outcome ? "ended" : "hunter",
    outcome,
    binocularUsedThisTurn: false,
    lastAction: {
      type: action === "stay" ? "duck-stay" : "duck-flight",
      playerId,
      data: action === "flight" ? { targetCell, trapped: newDuckSnaredTurns > 0 } : { trapped: newDuckSnaredTurns > 0 },
      timestamp: Date.now(),
    },
  })

  // Автоматическое завершение игры с начислением опыта при попадании на NPC
  if (outcome) {
    await endGameWithOutcome(lobbyId, outcome, undefined, playerId)
  }

  return { success: true, state: updatedState }
}

export async function useBinoculars(lobbyId: string, playerId: string) {
  const currentState = getGameState(lobbyId)
  if (!currentState || currentState.turn !== "hunter") {
    return { success: false, error: "Not hunter's turn" }
  }

  if (!currentState.inventory.hunter.binoculars || currentState.binocularUsedThisTurn) {
    return { success: false, error: "Cannot use binoculars" }
  }

  // Находим пустые клетки для раскрытия
  const empties = currentState.activeCells.filter(
    (c) =>
      c !== currentState.duckCell &&
      c !== currentState.beaverCell &&
      c !== currentState.wardenCell &&
      !currentState.shotCells.includes(c) &&
      !(currentState.revealedEmptyByBinoculars || []).includes(c),
  )

  // Выбираем случайную клетку для подсветки биноклем
  const targetCell = sample(
    currentState.activeCells.filter(
      (c) => !currentState.shotCells.includes(c) && !(currentState.binocularsUsedCells || []).includes(c),
    ),
  )

  if (!targetCell) {
    const updatedState = updateGameState(lobbyId, {
      binocularUsedThisTurn: true,
      turn: "duck", // Переход хода к утке после использования бинокля
      lastAction: {
        type: "use-binoculars",
        playerId,
        data: { revealed: [], targetCell: null },
        timestamp: Date.now(),
      },
    })
    return { success: true, state: updatedState }
  }

  // Отмечаем клетку как использованную биноклем
  const newBinocularsUsedCells = [...(currentState.binocularsUsedCells || []), targetCell]
  const newNotifications = [...(currentState.notifications || [])]

  let revealed = []
  if (targetCell === currentState.duckCell) {
    newNotifications.push(`🔍 Бинокль обнаружил утку в клетке ${targetCell + 1}!`)
  } else if (targetCell === currentState.beaverCell) {
    newNotifications.push(`🔍 Бинокль показал бобра в клетке ${targetCell + 1}`)
  } else if (targetCell === currentState.wardenCell) {
    newNotifications.push(`🔍 Бинокль показал смотрителя в клетке ${targetCell + 1}`)
  } else {
    revealed = [targetCell]
    newNotifications.push(`🔍 Бинокль показал пустую клетку ${targetCell + 1}`)
  }

  const newRevealed = [...(currentState.revealedEmptyByBinoculars || []), ...revealed]

  const updatedState = updateGameState(lobbyId, {
    revealedEmptyByBinoculars: newRevealed,
    binocularsUsedCells: newBinocularsUsedCells,
    notifications: newNotifications,
    binocularUsedThisTurn: true,
    turn: "duck", // Переход хода к утке после использования бинокля
    lastAction: {
      type: "use-binoculars",
      playerId,
      data: { revealed, targetCell },
      timestamp: Date.now(),
    },
  })

  return { success: true, state: updatedState }
}

export async function useDuckAbility(lobbyId: string, playerId: string, ability: "rain" | "safeFlight") {
  const currentState = getGameState(lobbyId)
  if (!currentState || currentState.turn !== "duck") {
    return { success: false, error: "Not duck's turn" }
  }

  let newInventory = currentState.inventory
  let newDuckCell = currentState.duckCell

  if (ability === "rain") {
    if (!currentState.inventory.duck.rain || currentState.inventory.duck.rainUsed) {
      return { success: false, error: "Cannot use rain" }
    }
    newInventory = {
      ...currentState.inventory,
      duck: { ...currentState.inventory.duck, rainActive: true, rainUsed: true },
    }
  } else if (ability === "safeFlight") {
    if (!currentState.inventory.duck.safeFlight) {
      return { success: false, error: "Cannot use safe flight" }
    }

    const safeCells = currentState.activeCells.filter(
      (c) =>
        c !== currentState.beaverCell &&
        c !== currentState.wardenCell &&
        !currentState.shotCells.includes(c) &&
        c !== currentState.duckCell,
    )

    if (safeCells.length === 0) {
      return { success: false, error: "No safe cells available" }
    }

    newDuckCell = sample(safeCells)

    // Проверяем капкан
    let newDuckSnaredTurns = 0
    if (currentState.inventory.hunter.trapPlaced === newDuckCell) {
      newDuckSnaredTurns = 1
    }

    const updatedState = updateGameState(lobbyId, {
      duckCell: newDuckCell,
      duckSnaredTurns: newDuckSnaredTurns,
      turn: "hunter",
      binocularUsedThisTurn: false,
      lastAction: {
        type: "use-safe-flight",
        playerId,
        data: { targetCell: newDuckCell, trapped: newDuckSnaredTurns > 0 },
        timestamp: Date.now(),
      },
    })
    return { success: true, state: updatedState }
  }

  const updatedState = updateGameState(lobbyId, {
    inventory: newInventory,
    turn: "hunter",
    binocularUsedThisTurn: false,
    lastAction: {
      type: `use-${ability}`,
      playerId,
      data: {},
      timestamp: Date.now(),
    },
  })

  return { success: true, state: updatedState }
}

export async function resetGame(lobbyId: string) {
  const currentState = getGameState(lobbyId)
  if (!currentState) {
    return { success: false, error: "Game not found" }
  }

  // Запускаем новый раунд
  return await initializeGame(lobbyId)
}

export async function purchasePerk(
  lobbyId: string,
  playerId: string,
  perkType: "binoculars" | "armored-feather",
  rank?: number,
) {
  const currentState = getGameState(lobbyId)
  if (!currentState) {
    return { success: false, error: "Game not found" }
  }

  let cost = 0
  const newInventory = { ...currentState.inventory }
  const newPlayerLevels = { ...currentState.playerLevels } || { hunter: 1, duck: 1 }

  if (perkType === "binoculars") {
    cost = 30
    if (currentState.hunterGold < cost) {
      return { success: false, error: "Недостаточно монет" }
    }

    newInventory.hunter.binoculars = true
    newPlayerLevels.hunter += 1
  } else if (perkType === "armored-feather" && rank) {
    const costs = { 1: 40, 2: 80, 3: 120 }
    cost = costs[rank as 1 | 2 | 3] || 0

    if (currentState.duckGold < cost) {
      return { success: false, error: "Недостаточно монет" }
    }

    if (rank <= currentState.inventory.duck.armoredFeatherRank) {
      return { success: false, error: "Уже куплен этот уровень или выше" }
    }

    newInventory.duck.armoredFeatherRank = rank
    newPlayerLevels.duck += 1
  }

  const updatedState = updateGameState(lobbyId, {
    inventory: newInventory,
    playerLevels: newPlayerLevels,
    hunterGold: perkType === "binoculars" ? currentState.hunterGold - cost : currentState.hunterGold,
    duckGold: perkType === "armored-feather" ? currentState.duckGold - cost : currentState.duckGold,
    lastAction: {
      type: "purchase-perk",
      playerId,
      data: { perkType, rank, cost },
      timestamp: Date.now(),
    },
  })

  return { success: true, state: updatedState }
}

export async function endGameWithOutcome(
  lobbyId: string,
  outcome: any,
  hunterPlayerId?: string,
  duckPlayerId?: string,
) {
  console.log("[v0] endGameWithOutcome called with:", { lobbyId, outcome, hunterPlayerId, duckPlayerId })

  const currentState = getGameState(lobbyId)
  if (!currentState) {
    return { success: false, error: "Game not found" }
  }

  const lobby = getLobby(lobbyId)
  let actualHunterPlayerId = hunterPlayerId
  let actualDuckPlayerId = duckPlayerId

  if (lobby && (!actualHunterPlayerId || !actualDuckPlayerId)) {
    console.log("[v0] Getting player IDs from lobby:", lobby.players)

    for (const player of lobby.players) {
      if (player.role === "hunter" && !actualHunterPlayerId) {
        actualHunterPlayerId = player.id
      } else if (player.role === "duck" && !actualDuckPlayerId) {
        actualDuckPlayerId = player.id
      }
    }

    console.log("[v0] Resolved player IDs:", { actualHunterPlayerId, actualDuckPlayerId })
  }

  let hunterGoldChange = 0
  let duckGoldChange = 0

  if (outcome.winner === "hunter") {
    hunterGoldChange = currentState.duckBet
    duckGoldChange = -currentState.duckBet

    if (currentState.inventory.duck.armoredFeatherRank > 0) {
      const protection = calculateArmoredFeatherProtection(currentState.inventory.duck.armoredFeatherRank)
      const savedAmount = Math.floor(currentState.duckBet * (protection / 100))
      duckGoldChange += savedAmount
      hunterGoldChange -= savedAmount
    }
  } else {
    duckGoldChange = currentState.hunterBet
    hunterGoldChange = -currentState.hunterBet
  }

  const newHunterGold = currentState.hunterGold + hunterGoldChange
  const newDuckGold = currentState.duckGold + duckGoldChange

  console.log("[v0] Gold changes:", { hunterGoldChange, duckGoldChange, newHunterGold, newDuckGold })

  // Сохраняем новый баланс в базу данных
  if (actualHunterPlayerId) {
    console.log("[v0] Updating hunter coins:", actualHunterPlayerId, newHunterGold)
    await updatePlayerCoins(actualHunterPlayerId, newHunterGold)
  } else {
    console.log("[v0] No hunterPlayerId available")
  }

  if (actualDuckPlayerId) {
    console.log("[v0] Updating duck coins:", actualDuckPlayerId, newDuckGold)
    await updatePlayerCoins(actualDuckPlayerId, newDuckGold)
  } else {
    console.log("[v0] No duckPlayerId available")
  }

  // Добавление начисления опыта за игру
  const baseExperience = 50
  const winnerBonus = 25
  let hunterExpGained = 0
  let duckExpGained = 0

  if (actualHunterPlayerId) {
    hunterExpGained = outcome.winner === "hunter" ? baseExperience + winnerBonus : baseExperience
    await updatePlayerExperience(actualHunterPlayerId, "hunter", hunterExpGained)
  }

  if (actualDuckPlayerId) {
    duckExpGained = outcome.winner === "duck" ? baseExperience + winnerBonus : baseExperience
    await updatePlayerExperience(actualDuckPlayerId, "duck", duckExpGained)
  }

  if (actualHunterPlayerId && actualDuckPlayerId) {
    const gameStartTime = currentState.gameStartTime || Date.now()
    const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000)

    console.log("[v0] Updating game session with final results:", {
      sessionId: currentState.sessionId,
      winner: outcome.winner,
      reason: outcome.reason,
      gameDuration,
    })

    // Update the existing game session record with final results
    await saveGameToHistory({
      sessionId: currentState.sessionId,
      lobbyId,
      hunterPlayerId: actualHunterPlayerId,
      duckPlayerId: actualDuckPlayerId,
      winner: outcome.winner,
      reason: outcome.reason,
      hunterBet: currentState.hunterBet,
      duckBet: currentState.duckBet,
      hunterCoinsChange: hunterGoldChange,
      duckCoinsChange: duckGoldChange,
      hunterExperienceGained: hunterExpGained,
      duckExperienceGained: duckExpGained,
      shotsFired: currentState.shotCells?.length || 0,
      movesMade: 1, // Simplified move counting
      durationSeconds: gameDuration,
    })
  }

  const updatedState = updateGameState(lobbyId, {
    outcome,
    turn: "ended",
    hunterGold: newHunterGold,
    duckGold: newDuckGold,
    lastAction: {
      type: "game-ended",
      playerId: "system",
      data: { outcome, hunterGoldChange, duckGoldChange },
      timestamp: Date.now(),
    },
  })

  return { success: true, state: updatedState }
}
