"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePlayer } from "@/contexts/player-context"

interface Game {
  game_id: string
  status: "running" | "ended"
  created_at: string
  ended_at?: string
  winner_username?: string
  loser_username?: string
  participants: Array<{
    player_id: string
    username: string
    bet_cents: number
    result: "pending" | "win" | "lose"
    role: "hunter" | "duck"
  }>
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const { player, refreshPlayer } = usePlayer()
  const supabase = createClient()

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/games")
      if (response.ok) {
        const data = await response.json()
        setGames(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching games:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGames()

    // Set up realtime subscriptions
    const gamesChannel = supabase
      .channel("games-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "games" }, () => fetchGames())
      .on("postgres_changes", { event: "*", schema: "public", table: "game_participants" }, () => fetchGames())
      .subscribe()

    // Subscribe to player balance changes
    if (player?.id) {
      const playerChannel = supabase
        .channel("player-balance")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "players",
            filter: `id=eq.${player.id}`,
          },
          () => refreshPlayer(),
        )
        .subscribe()

      return () => {
        gamesChannel.unsubscribe()
        playerChannel.unsubscribe()
      }
    }

    return () => {
      gamesChannel.unsubscribe()
    }
  }, [player?.id])

  const runningGames = games.filter((g) => g.status === "running")
  const historyGames = games.filter((g) => g.status === "ended")

  const formatCents = (cents: number) => `${(cents / 100).toFixed(2)} coins`

  if (loading) {
    return <div className="p-4">Loading games...</div>
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Game Center</h1>
        {player && (
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Balance</div>
              <div className="text-lg font-bold">{formatCents(player.gold || 0)}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Running Games */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Running Games ({runningGames.length})</h2>
        {runningGames.length === 0 ? (
          <p className="text-muted-foreground">No games currently running</p>
        ) : (
          <div className="grid gap-4">
            {runningGames.map((game) => (
              <Card key={game.game_id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Game in Progress</CardTitle>
                    <Badge variant="default">Running</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Started: {new Date(game.created_at).toLocaleString()}
                    </div>
                    <div className="flex gap-4">
                      {game.participants.map((participant) => (
                        <div key={participant.player_id} className="flex items-center gap-2">
                          <Badge variant="outline">{participant.role}</Badge>
                          <span>{participant.username}</span>
                          <span className="text-sm text-muted-foreground">
                            (Bet: {formatCents(participant.bet_cents)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Game History */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Game History ({historyGames.length})</h2>
        {historyGames.length === 0 ? (
          <p className="text-muted-foreground">No completed games</p>
        ) : (
          <div className="grid gap-4">
            {historyGames.map((game) => (
              <Card key={game.game_id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Completed Game</CardTitle>
                    <Badge variant="secondary">Ended</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {new Date(game.created_at).toLocaleString()} -{" "}
                      {game.ended_at && new Date(game.ended_at).toLocaleString()}
                    </div>
                    <div className="flex gap-4">
                      {game.participants.map((participant) => (
                        <div key={participant.player_id} className="flex items-center gap-2">
                          <Badge variant="outline">{participant.role}</Badge>
                          <span>{participant.username}</span>
                          {participant.result === "win" && <Badge variant="default">Winner</Badge>}
                          {participant.result === "lose" && <Badge variant="destructive">Loser</Badge>}
                          <span className="text-sm text-muted-foreground">
                            (Bet: {formatCents(participant.bet_cents)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
