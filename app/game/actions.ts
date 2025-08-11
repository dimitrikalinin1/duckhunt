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
  updateGameState(lobbyId, state)
  return { success: true, state }
}

export async function getGameStateAction(lobbyId: string) {
  const state = getGameState(lobbyId)
  return { success: true, state }
}

export async function startMultiplayerRound(lobbyId: string) {
  const currentState = getGameState(lobbyId)
  if (!currentState) {
    return { success: false, error: "Game not found" }
  }

  const level = LEVELS[currentState.level]
  const total = gridSize(level)
  const all = Array.from({ length: total }, (_, i) => i)
  const activeCells =
    level.activeCellCount && level.activeCellCount < total
      ? getRandomIndices(level.activeCellCount, all).sort((a, b) => a - b)
      : all

  // Выбираем случайную клетку для бобра
  const beaverCell = sample(activeCells)

  // Выбираем клетку для смотрителя (если нужно)
  let wardenCell = null
  if (level.hasWarden) {
    let w = sample(activeCells)
    while (w === beaverCell) w = sample(activeCells)
    wardenCell = w
  }

  // Настраиваем компас (если есть)
  let compassHint = []
  if (currentState.level >= 2 && currentState.inventory.hunter.compass) {
    const others = activeCells.filter((c) => c !== beaverCell)
    compassHint = [beaverCell, ...getRandomIndices(2, others)]
  }

  const updatedState = updateGameState(lobbyId, {
    activeCells,
    beaverCell,
    wardenCell,
    compassHint,
    shotCells: [],
    duckCell: null,
    ammo: level.ammo + (currentState.inventory.hunter.extraAmmo || 0),
    turn: "duck-initial",
    outcome: null,
    lastAction: {
      type: "start-round",
      playerId: "system",
      data: { level: currentState.level },
      timestamp: Date.now(),
    },
  })

  return { success: true, state: updatedState }
}

export async function makeGameAction(lobbyId: string, playerId: string, action: any) {
  const currentState = getGameState(lobbyId)
  if (!currentState) {
    return { success: false, error: "Game not found" }
  }

  // Обновляем состояние на основе действия
  const updatedState = updateGameState(lobbyId, {
    ...action.stateUpdate,
    lastAction: {
      type: action.type,
      playerId,
      data: action.data,
      timestamp: Date.now(),
    },
  })

  return { success: true, state: updatedState }
}

// Безопасный первый ход утки
export async function makeSafeDuckInitialMove(lobbyId: string, playerId: string) {
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

  // Обновляем состояние игры
  const updatedState = updateGameState(lobbyId, {
    duckCell,
    turn: "hunter",
    lastAction: {
      type: "duck-initial-move",
      playerId,
      data: { cell: duckCell },
      timestamp: Date.now(),
    },
  })

  return { success: true, state: updatedState }
}

export async function makeHunterShot(lobbyId: string, playerId: string, cell: number) {
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

  // Проверяем попадание
  if (currentState.wardenCell === cell) {
    outcome = { winner: "duck", reason: "hunter-hit-warden" }
    nextTurn = "ended"
  } else if (currentState.beaverCell === cell) {
    outcome = { winner: "duck", reason: "hunter-hit-beaver" }
    nextTurn = "ended"
  } else if (currentState.duckCell === cell) {
    outcome = { winner: "hunter", reason: "hunter-shot-duck" }
    nextTurn = "ended"
  } else if (newAmmo <= 0) {
    outcome = { winner: "duck", reason: "hunter-out-of-ammo" }
    nextTurn = "ended"
  }

  // Обновляем состояние игры
  const updatedState = updateGameState(lobbyId, {
    shotCells: newShotCells,
    ammo: newAmmo,
    turn: nextTurn,
    outcome,
    lastAction: {
      type: "hunter-shot",
      playerId,
      data: { cell, hit: currentState.duckCell === cell },
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

  if (action === "flight" && targetCell !== undefined) {
    // Проверяем валидность клетки для перелета
    if (!currentState.activeCells.includes(targetCell)) {
      return { success: false, error: "Invalid cell" }
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
  }

  // Обновляем состояние игры
  const updatedState = updateGameState(lobbyId, {
    duckCell: newDuckCell,
    turn: outcome ? "ended" : "hunter",
    outcome,
    lastAction: {
      type: action === "stay" ? "duck-stay" : "duck-flight",
      playerId,
      data: action === "flight" ? { targetCell } : {},
      timestamp: Date.now(),
    },
  })

  return { success: true, state: updatedState }
}
