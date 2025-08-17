import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Create a singleton instance of the Supabase client for Client Components
export const supabase = createClientComponentClient()

export const createClient = () => {
  if (!isSupabaseConfigured) {
    console.warn("Supabase is not configured properly")
    return null
  }
  return createClientComponentClient()
}

export type Player = {
  id: string
  telegram_id: number
  username?: string
  coins: number
  hunter_level: number
  hunter_experience: number
  duck_level: number
  duck_experience: number
  created_at: string
  updated_at: string
}

export type InventoryItem = {
  id: string
  player_id: string
  item_type: string
  quantity: number
  created_at: string
}
