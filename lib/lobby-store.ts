import type { Lobby, Player, LobbyAction } from "./lobby-types"

// Простое in-memory хранилище для демо
// В продакшене используйте Redis или базу данных
const lobbies = new Map<string, Lobby>()

export function createLobby(): Lobby {
  const id = Math.random().toString(36).substring(2, 8).toUpperCase()
  const lobby: Lobby = {
    id,
    players: [],
    status: "waiting",
    createdAt: Date.now(),
    maxPlayers: 2,
  }
  lobbies.set(id, lobby)
  return lobby
}

export function getLobby(id: string): Lobby | null {
  return lobbies.get(id) || null
}

export function updateLobby(id: string, action: LobbyAction): Lobby | null {
  const lobby = lobbies.get(id)
  if (!lobby) return null

  switch (action.type) {
    case "join": {
      if (lobby.players.length >= lobby.maxPlayers) return null
      if (lobby.players.some((p) => p.id === action.playerId)) return null

      const newPlayer: Player = {
        id: action.playerId,
        name: action.playerName,
        role: null,
        ready: false,
        joinedAt: Date.now(),
      }
      lobby.players.push(newPlayer)
      break
    }

    case "leave": {
      lobby.players = lobby.players.filter((p) => p.id !== action.playerId)
      if (lobby.players.length === 0) {
        lobbies.delete(id)
        return null
      }
      // Сбрасываем статус если кто-то ушел
      lobby.status = "waiting"
      lobby.countdownStarted = undefined
      break
    }

    case "selectRole": {
      const player = lobby.players.find((p) => p.id === action.playerId)
      if (!player) return null

      // Проверяем что роль не занята
      if (action.role && lobby.players.some((p) => p.id !== action.playerId && p.role === action.role)) {
        return null
      }

      player.role = action.role
      player.ready = action.role !== null

      // Проверяем готовность к игре
      checkGameStart(lobby)
      break
    }

    case "ready": {
      const player = lobby.players.find((p) => p.id === action.playerId)
      if (!player) return null
      player.ready = !player.ready
      checkGameStart(lobby)
      break
    }
  }

  lobbies.set(id, lobby)
  return lobby
}

function checkGameStart(lobby: Lobby) {
  if (lobby.players.length === 2) {
    const roles = lobby.players.map((p) => p.role).filter(Boolean)
    const hasHunter = roles.includes("hunter")
    const hasDuck = roles.includes("duck")
    const allReady = lobby.players.every((p) => p.ready)

    if (hasHunter && hasDuck && allReady && lobby.status === "waiting") {
      lobby.status = "countdown"
      lobby.countdownStarted = Date.now()

      // Автоматически запускаем игру через 5 секунд
      setTimeout(() => {
        const currentLobby = lobbies.get(lobby.id)
        if (currentLobby && currentLobby.status === "countdown") {
          currentLobby.status = "playing"
          currentLobby.gameStarted = Date.now()
          lobbies.set(lobby.id, currentLobby)
        }
      }, 5000)
    }
  }
}

export function getAllLobbies(): Lobby[] {
  return Array.from(lobbies.values())
}

export function cleanupOldLobbies() {
  const now = Date.now()
  const maxAge = 30 * 60 * 1000 // 30 минут

  for (const [id, lobby] of lobbies.entries()) {
    if (now - lobby.createdAt > maxAge) {
      lobbies.delete(id)
    }
  }
}
