import { supabase, isSupabaseConfigured, type Player, type InventoryItem } from "./supabase/client"

// Получить или создать игрока по Telegram ID
export async function getOrCreatePlayer(telegramId: number, username?: string): Promise<Player | null> {
  // Если Supabase не настроен, возвращаем тестового игрока
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured, returning mock player")
    return {
      id: `mock-${telegramId}`,
      telegram_id: telegramId,
      username: username || `Player${telegramId}`,
      coins: 100,
      hunter_level: 1,
      hunter_experience: 0,
      duck_level: 1,
      duck_experience: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  try {
    console.log("Searching for player with telegram_id:", telegramId)

    // Сначала попробуем найти существующего игрока
    const { data: existingPlayer, error: findError } = await supabase
      .from("players")
      .select("*")
      .eq("telegram_id", telegramId)
      .maybeSingle()

    if (findError) {
      console.error("Error finding player:", findError)
    }

    if (existingPlayer) {
      console.log("Found existing player:", existingPlayer)
      return existingPlayer
    }

    console.log("Creating new player for telegram_id:", telegramId)

    // Если игрок не найден, создаем нового
    const { data: newPlayer, error: createError } = await supabase
      .from("players")
      .insert({
        telegram_id: telegramId,
        username: username || `Player${telegramId}`,
        coins: 100,
        hunter_level: 1,
        hunter_experience: 0,
        duck_level: 1,
        duck_experience: 0,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating player:", createError)
      console.error("Error details:", JSON.stringify(createError, null, 2))
      return null
    }

    console.log("Created new player:", newPlayer)
    return newPlayer
  } catch (error) {
    console.error("Error in getOrCreatePlayer:", error)
    return null
  }
}

export async function getPlayerData(telegramId: string): Promise<{
  id: string
  username: string
  coins: number
  hunter_level: number
  hunter_experience: number
  duck_level: number
  duck_experience: number
} | null> {
  try {
    const player = await getOrCreatePlayer(Number.parseInt(telegramId))
    if (!player) return null

    return {
      id: player.id,
      username: player.username,
      coins: player.coins,
      hunter_level: player.hunter_level,
      hunter_experience: player.hunter_experience,
      duck_level: player.duck_level,
      duck_experience: player.duck_experience,
    }
  } catch (error) {
    console.error("Error in getPlayerData:", error)
    return null
  }
}

// Получить инвентарь игрока
export async function getPlayerInventory(playerId: string): Promise<InventoryItem[]> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured, returning empty inventory")
    return []
  }

  try {
    console.log("Fetching inventory for player:", playerId)

    const { data, error } = await supabase.from("inventory").select("*").eq("player_id", playerId)

    if (error) {
      console.error("Error fetching inventory:", error)
      return []
    }

    console.log("Fetched inventory:", data)
    return data || []
  } catch (error) {
    console.error("Error in getPlayerInventory:", error)
    return []
  }
}

// Добавить предмет в инвентарь
export async function addItemToInventory(playerId: string, itemType: string, quantity = 1): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured, skipping inventory update")
    return true // Возвращаем true для имитации успеха
  }

  try {
    console.log("Adding item to inventory:", { playerId, itemType, quantity })

    const { data: existingItem } = await supabase
      .from("inventory")
      .select("*")
      .eq("player_id", playerId)
      .eq("item_type", itemType)
      .maybeSingle()

    if (existingItem) {
      // Обновляем количество существующего предмета
      const { error } = await supabase
        .from("inventory")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id)

      if (error) {
        console.error("Error updating inventory item:", error)
        return false
      }
    } else {
      // Создаем новый предмет
      const { error } = await supabase.from("inventory").insert({
        player_id: playerId,
        item_type: itemType,
        quantity: quantity,
      })

      if (error) {
        console.error("Error adding item to inventory:", error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error in addItemToInventory:", error)
    return false
  }
}

export async function updatePlayerCoins(playerId: string, newCoins: number): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured, skipping coins update")
    return true
  }

  try {
    console.log("[v0] updatePlayerCoins called with:", { playerId, newCoins })

    // Сначала получим текущий баланс для сравнения
    const { data: currentPlayer, error: fetchError } = await supabase
      .from("players")
      .select("coins")
      .eq("id", playerId)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching current player coins:", fetchError)
    } else {
      console.log("[v0] Current player coins:", currentPlayer?.coins)
    }

    const { error } = await supabase.from("players").update({ coins: newCoins }).eq("id", playerId)

    if (error) {
      console.error("[v0] Error updating player coins:", error)
      return false
    }

    // Проверим что баланс действительно обновился
    const { data: updatedPlayer, error: verifyError } = await supabase
      .from("players")
      .select("coins")
      .eq("id", playerId)
      .single()

    if (verifyError) {
      console.error("[v0] Error verifying updated coins:", verifyError)
    } else {
      console.log("[v0] Updated player coins:", updatedPlayer?.coins)
      console.log("[v0] Coins update successful:", updatedPlayer?.coins === newCoins)
    }

    console.log("[v0] Successfully updated player coins")
    return true
  } catch (error) {
    console.error("[v0] Error in updatePlayerCoins:", error)
    return false
  }
}

// Обновить опыт игрока
export async function updatePlayerExperience(
  playerId: string,
  role: "hunter" | "duck",
  experienceGained: number,
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured, skipping experience update")
    return true
  }

  try {
    console.log("Updating player experience:", { playerId, role, experienceGained })

    const { data: player, error: fetchError } = await supabase.from("players").select("*").eq("id", playerId).single()

    if (fetchError || !player) {
      console.error("Error fetching player:", fetchError)
      return false
    }

    const currentExp = role === "hunter" ? player.hunter_experience : player.duck_experience
    const currentLevel = role === "hunter" ? player.hunter_level : player.duck_level
    const newExp = currentExp + experienceGained

    // Простая формула уровня: каждые 100 опыта = новый уровень
    const newLevel = Math.floor(newExp / 100) + 1

    const updateData =
      role === "hunter"
        ? { hunter_experience: newExp, hunter_level: newLevel }
        : { duck_experience: newExp, duck_level: newLevel }

    const { error: updateError } = await supabase.from("players").update(updateData).eq("id", playerId)

    if (updateError) {
      console.error("Error updating player experience:", updateError)
      return false
    }

    console.log("Successfully updated player experience")
    return true
  } catch (error) {
    console.error("Error in updatePlayerExperience:", error)
    return false
  }
}

export async function saveGameHistory(gameData: {
  hunterPlayerId: string
  duckPlayerId: string
  winnerRole: "hunter" | "duck"
  gameDuration?: number
  hunterShots?: number
  duckMoves?: number
  hunterCoinsChange?: number
  duckCoinsChange?: number
  hunterExpGained?: number
  duckExpGained?: number
}): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured, skipping game history save")
    return true
  }

  try {
    console.log("Saving game history:", gameData)

    const { error } = await supabase.from("game_history").insert({
      hunter_player_id: gameData.hunterPlayerId,
      duck_player_id: gameData.duckPlayerId,
      winner_role: gameData.winnerRole,
      game_duration: gameData.gameDuration || 0,
      hunter_shots: gameData.hunterShots || 0,
      duck_moves: gameData.duckMoves || 0,
      hunter_coins_change: gameData.hunterCoinsChange || 0,
      duck_coins_change: gameData.duckCoinsChange || 0,
      hunter_exp_gained: gameData.hunterExpGained || 0,
      duck_exp_gained: gameData.duckExpGained || 0,
    })

    if (error) {
      console.error("Error saving game history:", error)
      return false
    }

    console.log("Successfully saved game history")
    return true
  } catch (error) {
    console.error("Error in saveGameHistory:", error)
    return false
  }
}

export async function getPlayerStats(
  playerId: string,
  role?: "hunter" | "duck",
): Promise<{
  totalGames: number
  wins: number
  losses: number
  winRate: number
} | null> {
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured, returning mock stats")
    return { totalGames: 5, wins: 3, losses: 2, winRate: 60 }
  }

  try {
    console.log("Fetching player stats:", { playerId, role })

    let query = supabase.from("game_history").select("*")

    if (role === "hunter") {
      query = query.eq("hunter_player_id", playerId)
    } else if (role === "duck") {
      query = query.eq("duck_player_id", playerId)
    } else {
      query = query.or(`hunter_player_id.eq.${playerId},duck_player_id.eq.${playerId}`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching player stats:", error)
      return null
    }

    const games = data || []
    const totalGames = games.length

    let wins = 0
    games.forEach((game) => {
      if (role === "hunter" && game.winner_role === "hunter") wins++
      else if (role === "duck" && game.winner_role === "duck") wins++
      else if (!role) {
        // Общая статистика - считаем победы в любой роли
        if (
          (game.hunter_player_id === playerId && game.winner_role === "hunter") ||
          (game.duck_player_id === playerId && game.winner_role === "duck")
        ) {
          wins++
        }
      }
    })

    const losses = totalGames - wins
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

    return { totalGames, wins, losses, winRate }
  } catch (error) {
    console.error("Error in getPlayerStats:", error)
    return null
  }
}
