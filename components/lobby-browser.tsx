"use client"

import { useState, useEffect } from "react"
import { Users, Plus, RefreshCw } from "lucide-react"
import { createNewLobby, getAvailableLobbies, joinLobby } from "@/app/lobby/actions"
import type { Lobby } from "@/lib/lobby-types"

type Props = {
  playerId: string
  playerName: string
  onJoinLobby: (lobbyId: string) => void
  onBackToMenu?: () => void
}

export default function LobbyBrowser({ playerId, playerName, onJoinLobby, onBackToMenu }: Props) {
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
    <div className="space-y-6 animate-slide-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
          🎯 Найти игру
        </h1>
        <p className="text-slate-300">Создайте игру или присоединитесь к существующей</p>
      </div>

      <div className="grid gap-4">
        <div className="game-card group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Создать новую игру</h3>
              <p className="text-slate-400 text-sm">Станьте хостом игры</p>
            </div>
          </div>
          <button onClick={handleCreateLobby} disabled={loading} className="game-button-primary w-full">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Создание...
              </div>
            ) : (
              "🚀 Создать лобби"
            )}
          </button>
        </div>

        <div className="game-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Присоединиться по коду</h3>
              <p className="text-slate-400 text-sm">Введите код лобби</p>
            </div>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Введите код лобби"
              value={customLobbyId}
              onChange={(e) => setCustomLobbyId(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
            />
            <button
              onClick={handleJoinCustomLobby}
              disabled={loading || !customLobbyId.trim()}
              className="game-button-secondary w-full"
            >
              🎮 Присоединиться
            </button>
          </div>
        </div>
      </div>

      <div className="game-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Доступные игры</h3>
              <p className="text-slate-400 text-sm">{lobbies.length} активных лобби</p>
            </div>
          </div>
          <button
            onClick={loadLobbies}
            className="w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center hover:bg-slate-700/50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-slate-300" />
          </button>
        </div>

        {lobbies.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎯</div>
            <div className="text-slate-400">Нет доступных игр</div>
            <div className="text-slate-500 text-sm mt-1">Создайте новую игру!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {lobbies.map((lobby) => (
              <div
                key={lobby.id}
                className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700 rounded-xl hover:bg-slate-700/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="font-mono font-bold text-xl text-cyan-400">{lobby.id}</div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-slate-700 rounded-lg text-xs text-slate-300">
                      {lobby.players.length}/{lobby.maxPlayers} игроков
                    </span>
                    <span className="px-2 py-1 bg-slate-700 rounded-lg text-xs text-slate-300">
                      {new Date(lobby.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 max-w-32 truncate">
                    {lobby.players.map((p) => p.name).join(", ")}
                  </div>
                </div>
                <button onClick={() => handleJoinLobby(lobby.id)} disabled={loading} className="game-button-secondary">
                  Войти
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
