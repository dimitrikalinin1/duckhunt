"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button" // исправляем импорт кнопки
import LobbyBrowser from "@/components/lobby-browser"
import LobbyRoom from "@/components/lobby-room"
import GameSession from "@/components/game-session"
import { ArrowLeft } from "lucide-react"
import type { PlayerCharacter } from "@/lib/ai-opponent"
import type { PlayerRole } from "@/lib/lobby-types"

export default function MultiplayerPage() {
  const [playerId] = useState(() => Math.random().toString(36).substring(2, 10))
  const [playerName, setPlayerName] = useState("")
  const [currentLobby, setCurrentLobby] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [playerRole, setPlayerRole] = useState<PlayerRole>(null)
  const router = useRouter()

  useEffect(() => {
    const names = ["Игрок", "Охотник", "Утка", "Снайпер", "Следопыт", "Разведчик"]
    const randomName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000)
    setPlayerName(randomName)
  }, [])

  const handleJoinLobby = (lobbyId: string) => {
    setCurrentLobby(lobbyId)
  }

  const handleLeaveLobby = () => {
    setCurrentLobby(null)
    setGameStarted(false)
    setPlayerRole(null)
  }

  const handleStartGame = (role: PlayerRole) => {
    setPlayerRole(role)
    setGameStarted(true)
  }

  const handleBackToMainMenu = () => {
    router.push("/")
  }

  if (gameStarted && playerRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg fill%3D%22none%22 fillRule%3D%22evenodd%22%3E%3Cg fill%3D%22%239C92AC%22 fillOpacity%3D%220.1%22%3E%3Ccircle cx%3D%2230%22 cy%3D%2230%22 r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <GameSession
          playerCharacter={playerRole as PlayerCharacter}
          onBackToMenu={handleBackToMainMenu}
          isMultiplayer={true}
          lobbyId={currentLobby}
          playerId={playerId}
        />
      </div>
    )
  }

  if (currentLobby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg fill%3D%22none%22 fillRule%3D%22evenodd%22%3E%3Cg fill%3D%22%239C92AC%22 fillOpacity%3D%220.1%22%3E%3Ccircle cx%3D%2230%22 cy%3D%2230%22 r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="mb-6">
            <Button onClick={handleBackToMainMenu} className="game-button-secondary group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Назад
            </Button>
          </div>
          <LobbyRoom
            lobbyId={currentLobby}
            playerId={playerId}
            onLeaveLobby={handleLeaveLobby}
            onStartGame={handleStartGame}
            onBackToMenu={handleBackToMainMenu}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg fill%3D%22none%22 fillRule%3D%22evenodd%22%3E%3Cg fill%3D%22%239C92AC%22 fillOpacity%3D%220.1%22%3E%3Ccircle cx%3D%2230%22 cy%3D%2230%22 r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      <div className="max-w-md mx-auto relative z-10">
        <div className="mb-6">
          <Button onClick={handleBackToMainMenu} className="game-button-secondary group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Назад
          </Button>
        </div>
        <LobbyBrowser
          playerId={playerId}
          playerName={playerName}
          onJoinLobby={handleJoinLobby}
          onBackToMenu={handleBackToMainMenu}
        />
      </div>
    </div>
  )
}
