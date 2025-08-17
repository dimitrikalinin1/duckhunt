import { createClient } from "@/lib/supabase/client"

export interface AdminPlayerData {
  id: string
  telegram_id: string
  username: string
  coins: number
  hunter_level: number
  hunter_experience: number
  duck_level: number
  duck_experience: number
  created_at: string
  last_played: string
}

export interface InventoryItem {
  id: string
  item_type: string
  quantity: number
  created_at: string
}

export async function getPlayersForAdmin(): Promise<AdminPlayerData[]> {
  try {
    const supabase = createClient()

    if (!supabase) {
      console.warn("Supabase client not available, returning mock data")
      return getMockPlayersData()
    }

    const { data, error } = await supabase.from("players").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching players:", error)
      return getMockPlayersData()
    }

    if (!data || data.length === 0) {
      console.log("No players found in database")
      return []
    }

    return data.map((player) => ({
      id: player.id,
      telegram_id: player.telegram_id,
      username: player.username || "Unknown User",
      coins: player.coins || 100,
      hunter_level: Math.floor((player.hunter_experience || 0) / 100) + 1,
      hunter_experience: (player.hunter_experience || 0) % 100,
      duck_level: Math.floor((player.duck_experience || 0) / 100) + 1,
      duck_experience: (player.duck_experience || 0) % 100,
      created_at: player.created_at || new Date().toISOString(),
      last_played: player.updated_at || player.created_at || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Error in getPlayersForAdmin:", error)
    return getMockPlayersData()
  }
}

export async function getPlayerInventory(playerId: string): Promise<InventoryItem[]> {
  try {
    const supabase = createClient()

    if (!supabase) {
      console.warn("Supabase client not available, returning mock inventory")
      return getMockInventoryData(playerId)
    }

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching player inventory:", error)
      return getMockInventoryData(playerId)
    }

    return (data || []).map((item) => ({
      id: item.id,
      item_type: item.item_type,
      quantity: item.quantity || 1,
      created_at: item.created_at || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Error in getPlayerInventory:", error)
    return getMockInventoryData(playerId)
  }
}

function getMockPlayersData(): AdminPlayerData[] {
  return [
    {
      id: "mock-1",
      telegram_id: "123456789",
      username: "TestPlayer1",
      coins: 150,
      hunter_level: 2,
      hunter_experience: 45,
      duck_level: 1,
      duck_experience: 80,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      last_played: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-2",
      telegram_id: "987654321",
      username: "TestPlayer2",
      coins: 75,
      hunter_level: 1,
      hunter_experience: 25,
      duck_level: 3,
      duck_experience: 10,
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      last_played: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-3",
      telegram_id: "555666777",
      username: "TestPlayer3",
      coins: 200,
      hunter_level: 4,
      hunter_experience: 90,
      duck_level: 2,
      duck_experience: 55,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_played: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

function getMockInventoryData(playerId: string): InventoryItem[] {
  const inventories: Record<string, InventoryItem[]> = {
    "mock-1": [
      {
        id: "inv-1",
        item_type: "binoculars",
        quantity: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: "inv-2",
        item_type: "armored_feather",
        quantity: 2,
        created_at: new Date().toISOString(),
      },
    ],
    "mock-2": [
      {
        id: "inv-3",
        item_type: "extra_shot",
        quantity: 3,
        created_at: new Date().toISOString(),
      },
    ],
    "mock-3": [
      {
        id: "inv-4",
        item_type: "binoculars",
        quantity: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: "inv-5",
        item_type: "ghost_flight",
        quantity: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: "inv-6",
        item_type: "armored_feather",
        quantity: 1,
        created_at: new Date().toISOString(),
      },
    ],
  }

  return inventories[playerId] || []
}

export async function getPlayerStats(): Promise<{
  totalPlayers: number
  activePlayers: number
  totalCoins: number
  averageLevel: number
}> {
  try {
    const players = await getPlayersForAdmin()
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const activePlayers = players.filter((p) => new Date(p.last_played) > oneDayAgo).length
    const totalCoins = players.reduce((sum, p) => sum + p.coins, 0)
    const averageLevel =
      players.length > 0
        ? players.reduce((sum, p) => sum + Math.max(p.hunter_level, p.duck_level), 0) / players.length
        : 0

    return {
      totalPlayers: players.length,
      activePlayers,
      totalCoins,
      averageLevel: Math.round(averageLevel * 10) / 10,
    }
  } catch (error) {
    console.error("Error getting player stats:", error)
    return {
      totalPlayers: 0,
      activePlayers: 0,
      totalCoins: 0,
      averageLevel: 0,
    }
  }
}

export async function searchPlayers(query: string): Promise<AdminPlayerData[]> {
  try {
    const allPlayers = await getPlayersForAdmin()

    if (!query.trim()) {
      return allPlayers
    }

    const searchTerm = query.toLowerCase()
    return allPlayers.filter(
      (player) => player.username.toLowerCase().includes(searchTerm) || player.telegram_id.includes(searchTerm),
    )
  } catch (error) {
    console.error("Error searching players:", error)
    return []
  }
}

export function calculateLevelFromExperience(totalExperience: number): { level: number; currentExp: number } {
  const level = Math.floor(totalExperience / 100) + 1
  const currentExp = totalExperience % 100
  return { level, currentExp }
}

export function calculateExperienceFromLevel(level: number, currentExp = 0): number {
  return (level - 1) * 100 + currentExp
}

export async function updatePlayerCoins(playerId: string, newCoins: number): Promise<boolean> {
  try {
    const supabase = createClient()

    if (!supabase) {
      console.warn("Supabase client not available, simulating update")
      return true
    }

    const { error } = await supabase.from("players").update({ coins: newCoins }).eq("id", playerId)

    if (error) {
      console.error("Error updating player coins:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updatePlayerCoins:", error)
    return false
  }
}

export async function updatePlayerLevel(playerId: string, role: "hunter" | "duck", newLevel: number): Promise<boolean> {
  try {
    const supabase = createClient()

    if (!supabase) {
      console.warn("Supabase client not available, simulating update")
      return true
    }

    const experienceField = role === "hunter" ? "hunter_experience" : "duck_experience"
    const newExperience = (newLevel - 1) * 100

    const { error } = await supabase
      .from("players")
      .update({ [experienceField]: newExperience })
      .eq("id", playerId)

    if (error) {
      console.error("Error updating player level:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updatePlayerLevel:", error)
    return false
  }
}

export async function updatePlayerExperience(
  playerId: string,
  role: "hunter" | "duck",
  newExperience: number,
): Promise<boolean> {
  try {
    const supabase = createClient()

    if (!supabase) {
      console.warn("Supabase client not available, simulating update")
      return true
    }

    const experienceField = role === "hunter" ? "hunter_experience" : "duck_experience"

    const { error } = await supabase
      .from("players")
      .update({ [experienceField]: newExperience })
      .eq("id", playerId)

    if (error) {
      console.error("Error updating player experience:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updatePlayerExperience:", error)
    return false
  }
}
