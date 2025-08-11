"use server"

import { getGameState, updateGameState, createInitialGameState } from "@/lib/game-state"

export async function initializeGame(lobbyId: string) {
  const state = createInitialGameState(lobbyId)
  updateGameState(lobbyId, state)
  return { success: true, state }
}

export async function getGameStateAction(lobbyId: string) {
  const state = getGameState(lobbyId)
  return { success: true, state }
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
