"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, RefreshCw } from "lucide-react"
import { createNewLobby, getAvailableLobbies, joinLobby } from "@/app/lobby/actions"
import type { Lobby } from "@/lib/lobby-types"

type Props = {
  playerId: string
  playerName: string
  onJoinLobby: (lobbyId: string) => void
}

export default function LobbyBrowser({ playerId, playerName, onJoinLobby }: Props) {
  const [lobbies, setLobbies] = useState<Lobby[]>([])
  const [loading, setLoading] = useState(false)
  const [customLobbyId, setCustomLobbyId] = useState("")

  const loadLobbies = async () => {
    const result = await getAvailableLobbies()
    if (result.success) {
      setLobbies(result.lobbies)
    }
  }

  useEffect(() => {
    loadLobbies()
    const interval = setInterval(loadLobbies, 2000) // Обновляем каждые 2 секунды
    return () => clearInterval(interval)
  }, [])

  const handleCreateLobby = async () => {
    setLoading(true)
    const result = await createNewLobby()
    if (result.success) {
      const joinResult = await joinLobby(result.lobby.id, playerId, playerName)
      if (joinResult.success) {
        onJoinLobby(result.lobby.id)
      }
    }
    setLoading(false)
  }

  const handleJoinLobby = async (lobbyId: string) => {
    setLoading(true)
    const result = await joinLobby(lobbyId, playerId, playerName)
    if (result.success) {
      onJoinLobby(lobbyId)
    }
    setLoading(false)
  }

  const handleJoinCustomLobby = async () => {
    if (!customLobbyId.trim()) return
    await handleJoinLobby(customLobbyId.toUpperCase())
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Многопользовательское лобби</h1>
          <p className="text-muted-foreground">Создайте игру или присоединитесь к существующей</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Создать новую игру
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateLobby} disabled={loading} className="w-full" size="lg">
                {loading ? "Создание..." : "Создать лобби"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Присоединиться по коду</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Введите код лобби"
                value={customLobbyId}
                onChange={(e) => setCustomLobbyId(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <Button onClick={handleJoinCustomLobby} disabled={loading || !customLobbyId.trim()} className="w-full">
                Присоединиться
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Доступные игры ({lobbies.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={loadLobbies}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lobbies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Нет доступных игр. Создайте новую!</div>
            ) : (
              <div className="grid gap-3">
                {lobbies.map((lobby) => (
                  <div
                    key={lobby.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="font-mono font-bold text-lg">{lobby.id}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {lobby.players.length}/{lobby.maxPlayers} игроков
                        </Badge>
                        <Badge variant="secondary">{new Date(lobby.createdAt).toLocaleTimeString()}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{lobby.players.map((p) => p.name).join(", ")}</div>
                    </div>
                    <Button onClick={() => handleJoinLobby(lobby.id)} disabled={loading}>
                      Присоединиться
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
