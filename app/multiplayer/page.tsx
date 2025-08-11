"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SceneBackground from "@/components/scene-background"
import AppHeader from "@/components/app-header"
import LobbyBrowser from "@/components/lobby-browser"
import LobbyRoom from "@/components/lobby-room"
import GameSession from "@/components/game-session"
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
    // Генерируем случайное имя игрока
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

  const handleBackToMenu = () => {
    router.push("/")
  }

  if (gameStarted && playerRole) {
    return (
      <SceneBackground>
        <AppHeader />
        <GameSession
          playerCharacter={playerRole as PlayerCharacter}
          onBackToMenu={handleLeaveLobby}
          isMultiplayer={true}
          lobbyId={currentLobby}
          playerId={playerId}
        />
      </SceneBackground>
    )
  }

  if (currentLobby) {
    return (
      <SceneBackground>
        <AppHeader />
        <LobbyRoom
          lobbyId={currentLobby}
          playerId={playerId}
          onLeaveLobby={handleLeaveLobby}
          onStartGame={handleStartGame}
        />
      </SceneBackground>
    )
  }

  return (
    <SceneBackground>
      <AppHeader />
      <LobbyBrowser playerId={playerId} playerName={playerName} onJoinLobby={handleJoinLobby} />
    </SceneBackground>
  )
}
