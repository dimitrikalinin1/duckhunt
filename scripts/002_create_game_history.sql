-- Создание таблицы истории игр
CREATE TABLE IF NOT EXISTS game_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hunter_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  duck_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  winner_role TEXT NOT NULL CHECK (winner_role IN ('hunter', 'duck')),
  game_duration INTEGER, -- в секундах
  hunter_shots INTEGER DEFAULT 0,
  duck_moves INTEGER DEFAULT 0,
  hunter_coins_change INTEGER DEFAULT 0,
  duck_coins_change INTEGER DEFAULT 0,
  hunter_exp_gained INTEGER DEFAULT 0,
  duck_exp_gained INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_game_history_hunter_player ON game_history(hunter_player_id);
CREATE INDEX IF NOT EXISTS idx_game_history_duck_player ON game_history(duck_player_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at);
