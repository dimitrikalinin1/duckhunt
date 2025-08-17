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
  preferredRole?: string
}

export default function LobbyBrowser({ playerId, playerName, onJoinLobby, onBackToMenu, preferredRole }: Props) {
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
        <h1 className="text-3xl font-bold text-white mb-2">🎯 Поиск игры</h1>
        <p className="text-slate-400">Создайте игру или присоединитесь к существующей</p>
        {preferredRole && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700">
            <span className="text-2xl">{preferredRole === "hunter" ? "🏹" : "🦆"}</span>
            <span className="text-white font-medium">{preferredRole === "hunter" ? "Охотник" : "Утка"}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        <div className="game-card group border-green-500/30 bg-gradient-to-br from-green-900/20 to-emerald-900/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-pulse-glow">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Создать новую игру</h3>
              <p className="text-slate-300">Станьте хостом и пригласите друга</p>
            </div>
          </div>
          <button
            onClick={handleCreateLobby}
            disabled={loading}
            className="w-full py-4 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Создание лобби...
              </div>
            ) : (
              "🚀 Создать игру"
            )}
          </button>
        </div>

        <div className="game-card group border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-cyan-900/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center animate-pulse-glow">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Присоединиться к игре</h3>
              <p className="text-slate-300">Введите код лобби от друга</p>
            </div>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Введите код лобби (например: ABC123)"
              value={customLobbyId}
              onChange={(e) => setCustomLobbyId(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-4 text-lg bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
            />
            <button
              onClick={handleJoinCustomLobby}
              disabled={loading || !customLobbyId.trim()}
              className="w-full py-4 text-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:hover:scale-100"
            >
              🎮 Присоединиться к игре
            </button>
          </div>
        </div>
      </div>

      {lobbies.length > 0 && (
        <div className="game-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Открытые игры</h3>
                <p className="text-slate-400">{lobbies.length} доступных лобби</p>
              </div>
            </div>
            <button
              onClick={loadLobbies}
              className="w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center hover:bg-slate-700/50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-slate-300" />
            </button>
          </div>

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
                  </div>
                </div>
                <button
                  onClick={() => handleJoinLobby(lobby.id)}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                >
                  Войти
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
