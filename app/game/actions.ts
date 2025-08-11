"use server"

import { getGameState, updateGameState, createInitialGameState } from "@/lib/game-state"
import { LEVELS, gridSize } from "@/lib/game-config"

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
export async function makeDuckInitialMove(lobbyId: string, playerId: string) {
  const currentState = getGameState(lobbyId)
  if (!currentState || currentState.turn !== "duck-initial") {
    return { success: false, error: "Invalid game state" }
  }

  // Находим безопасные клетки (не бобр и не смотритель)
  const safeCells = currentState.activeCells.filter(
    (cell) => cell !== currentState.beaverCell && cell !== currentState.wardenCell,
  )

  if (safeCells.length === 0) {
    return { success: false, error: "No safe cells available" }
  }

  // Выбираем случайную безопасную клетку
  const duckCell = sample(safeCells)

  // Проверяем капкан
  let duckSnaredTurns = 0
  if (currentState.inventory.hunter.trapPlaced === duckCell) {
    duckSnaredTurns = 1
  }

  // Обновляем состояние игры
  const updatedState = updateGameState(lobbyId, {
    duckCell,
    duckSnaredTurns,
    turn: "hunter",
    binocularUsedThisTurn: false,
    lastAction: {
      type: "duck-initial-move",
      playerId,
      data: { cell: duckCell, trapped: duckSnaredTurns > 0 },
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

  if (action === "flight" && targetCell !== undefined) {
    // Проверяем валидность клетки для перелета
    if (!currentState.activeCells.includes(targetCell)) {
      return { success: false, error: "Invalid cell" }
    }

    // Проверяем можем ли лететь на обстрелянную клетку
    if (currentState.shotCells.includes(targetCell) && !currentState.inventory.duck.ghostFlight) {
      return { success: false, error: "Cannot fly to shot cell without ghost flight" }
    }

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

  if (empties.length === 0) {
    const updatedState = updateGameState(lobbyId, {
      binocularUsedThisTurn: true,
      lastAction: {
        type: "use-binoculars",
        playerId,
        data: { revealed: [] },
        timestamp: Date.now(),
      },
    })
    return { success: true, state: updatedState }
  }

  const revealCount = currentState.inventory.hunter.binocularsPlus ? 2 : 1
  const reveal = getRandomIndices(Math.min(revealCount, empties.length), empties)
  const newRevealed = [...(currentState.revealedEmptyByBinoculars || []), ...reveal]

  const updatedState = updateGameState(lobbyId, {
    revealedEmptyByBinoculars: newRevealed,
    binocularUsedThisTurn: true,
    lastAction: {
      type: "use-binoculars",
      playerId,
      data: { revealed: reveal },
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
