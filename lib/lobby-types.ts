export type PlayerRole = "hunter" | "duck" | null
export type LobbyStatus = "waiting" | "countdown" | "playing" | "finished"

export type Player = {
  id: string
  name: string
  role: PlayerRole
  ready: boolean
  joinedAt: number
}

export type Lobby = {
  id: string
  players: Player[]
  status: LobbyStatus
  countdownStarted?: number
  gameStarted?: number
  createdAt: number
  maxPlayers: 2
}

export type LobbyAction =
  | { type: "join"; playerId: string; playerName: string }
  | { type: "leave"; playerId: string }
  | { type: "selectRole"; playerId: string; role: PlayerRole }
  | { type: "ready"; playerId: string }
