"use server"

import { createLobby, getLobby, updateLobby, getAllLobbies } from "@/lib/lobby-store"

export async function createNewLobby() {
  const lobby = createLobby()
  return { success: true, lobby }
}

export async function joinLobby(lobbyId: string, playerId: string, playerName: string) {
  const lobby = updateLobby(lobbyId, { type: "join", playerId, playerName })
  if (!lobby) {
    return { success: false, error: "Лобби не найдено или заполнено" }
  }
  return { success: true, lobby }
}

export async function leaveLobby(lobbyId: string, playerId: string) {
  const lobby = updateLobby(lobbyId, { type: "leave", playerId })
  return { success: true, lobby }
}

export async function selectRole(lobbyId: string, playerId: string, role: "hunter" | "duck" | null) {
  const lobby = updateLobby(lobbyId, { type: "selectRole", playerId, role })
  if (!lobby) {
    return { success: false, error: "Роль уже занята" }
  }
  return { success: true, lobby }
}

export async function getLobbyState(lobbyId: string) {
  const lobby = getLobby(lobbyId)
  return { success: true, lobby }
}

export async function getAvailableLobbies() {
  const lobbies = getAllLobbies().filter((l) => l.players.length < l.maxPlayers && l.status === "waiting")
  return { success: true, lobbies }
}
