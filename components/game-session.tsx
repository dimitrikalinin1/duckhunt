"use client"

import { Button } from "@/components/ui/button"
import { Telescope } from "path-to-telescope-icon" // Import Telescope icon
import { useState } from "react" // Import useState for managing state

const GameSession = () => {
  const [inv, setInv] = useState({ hunter: { binoculars: true } }) // Declare inv state
  const [binocularUsedThisTurn, setBinocularUsedThisTurn] = useState(false) // Declare binocularUsedThisTurn state
  const [isLoading, setIsLoading] = useState(false) // Declare isLoading state

  const handleBinocularsWithSound = () => {
    // Function implementation here
    setBinocularUsedThisTurn(true)
  }

  return (
    <div>
      <Button
        variant={inv.hunter.binoculars && !binocularUsedThisTurn ? "secondary" : "outline"}
        onClick={handleBinocularsWithSound}
        disabled={!inv.hunter.binoculars || binocularUsedThisTurn || isLoading}
      >
        <Telescope className="mr-2 h-4 w-4" />
        {"Бинокль"}
      </Button>
      {/* ** rest of code here ** */}
    </div>
  )
}

export default GameSession
