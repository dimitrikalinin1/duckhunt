import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { winnerId, loserId } = await request.json()
    const gameId = params.id

    // Validate input
    if (!winnerId || !loserId) {
      return NextResponse.json({ error: "Winner and loser IDs required" }, { status: 400 })
    }

    if (winnerId === loserId) {
      return NextResponse.json({ error: "Winner and loser must be different" }, { status: 400 })
    }

    // Call RPC to settle game atomically
    const { error } = await supabase.rpc("settle_game", {
      p_game_id: gameId,
      p_winner: winnerId,
      p_loser: loserId,
    })

    if (error) {
      console.error("[v0] Error settling game:", error)
      if (error.message.includes("already ended")) {
        return NextResponse.json({ message: "Game already ended" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Game settled successfully:", gameId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[v0] API error settling game:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
