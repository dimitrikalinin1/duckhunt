export type GameState = {
  lobbyId: string
  level: number
  activeCells: number[]
  shotCells: number[]
  beaverCell: number | null
  wardenCell: number | null
  duckCell: number | null
  ammo: number
  turn: "pre-bets" | "duck-initial" | "hunter" | "duck" | "ended"
  outcome: any | null
  hunterBet: number
  duckBet: number
  hunterGold: number
  duckGold: number
  bank: number
  beaverVault: number
  wardenVault: number
  inventory: any
  lastAction?: {
    type: string
    playerId: string
    data: any
    timestamp: number
  }
}

// In-memory хранилище состояний игр
const gameStates = new Map<string, GameState>()

export function getGameState(lobbyId: string): GameState | null {
  return gameStates.get(lobbyId) || null
}

export function updateGameState(lobbyId: string, state: Partial<GameState>): GameState {
  const current = gameStates.get(lobbyId) || createInitialGameState(lobbyId)
  const updated = { ...current, ...state }
  gameStates.set(lobbyId, updated)
  return updated
}

export function createInitialGameState(lobbyId: string): GameState {
  return {
    lobbyId,
    level: 1,
    activeCells: [],
    shotCells: [],
    beaverCell: null,
    wardenCell: null,
    duckCell: null,
    ammo: 3,
    turn: "pre-bets",
    outcome: null,
    hunterBet: 25,
    duckBet: 25,
    hunterGold: 500,
    duckGold: 500,
    bank: 0,
    beaverVault: 0,
    wardenVault: 0,
    inventory: {
      hunter: {
        binoculars: false,
        compass: false,
        trap: false,
        trapPlaced: null,
        apBullet: 0,
        extraAmmo: 0,
        eagleEye: false,
        binocularsPlus: false,
        enhancedPayout: false,
        eagleEyeUsed: false,
      },
      duck: {
        flight: false,
        safeFlight: false,
        armoredFeatherRank: 0,
        autoFlight: false,
        mirrorPlumage: false,
        rain: false,
        rainActive: false,
        ghostFlight: false,
        mirrorUsed: false,
        autoFlightUsed: false,
        rainUsed: false,
      },
    },
  }
}

export function deleteGameState(lobbyId: string) {
  gameStates.delete(lobbyId)
}
