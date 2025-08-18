import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { playerIds, betsCents, roles, lobbyId, sessionId } = await request.json()

    // Validate input
    if (!Array.isArray(playerIds) || playerIds.length !== 2) {
      return NextResponse.json({ error: "Exactly 2 player IDs required" }, { status: 400 })
    }

    if (!Array.isArray(betsCents) || betsCents.length !== 2) {
      return NextResponse.json({ error: "Exactly 2 bets required" }, { status: 400 })
    }

    if (betsCents.some((bet) => bet < 0)) {
      return NextResponse.json({ error: "Bets must be non-negative" }, { status: 400 })
    }

    // Call RPC to create game atomically
    const { data, error } = await supabase.rpc("create_game_with_bets", {
      p_player_ids: playerIds,
      p_bets: betsCents,
      p_roles: roles || ["hunter", "duck"],
      p_lobby_id: lobbyId,
      p_session_id: sessionId,
    })

    if (error) {
      console.error("[v0] Error creating game:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Game created successfully:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API error creating game:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get("playerId")

    // Get games with participants
    const { data, error } = await supabase.rpc("get_games_with_participants", {
      p_player_id: playerId || null,
    })

    if (error) {
      console.error("[v0] Error fetching games:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] API error fetching games:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
