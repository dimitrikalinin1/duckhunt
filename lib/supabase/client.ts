import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
