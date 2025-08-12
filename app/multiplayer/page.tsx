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
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-green-400 p-4">
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
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-green-400 p-4">
        <div className="max-w-4xl mx-auto">
          {/* добавляем кнопку назад из лобби */}
          <div className="mb-4">
            <Button onClick={handleBackToMainMenu} variant="outline" className="bg-white/20 hover:bg-white/30">
              <ArrowLeft className="mr-2 h-4 w-4" />
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
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-green-400 p-4">
      <div className="max-w-md mx-auto">
        {/* добавляем кнопку назад из браузера лобби */}
        <div className="mb-4">
          <Button onClick={handleBackToMainMenu} variant="outline" className="bg-white/20 hover:bg-white/30">
            <ArrowLeft className="mr-2 h-4 w-4" />
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
