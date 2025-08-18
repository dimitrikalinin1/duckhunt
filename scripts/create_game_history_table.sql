-- Создание таблицы для истории игр с сессиями и ставками
CREATE TABLE IF NOT EXISTS game_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE,
  lobby_id TEXT NOT NULL,
  hunter_player_id UUID REFERENCES players(id),
  duck_player_id UUID REFERENCES players(id),
  winner TEXT CHECK (winner IN ('hunter', 'duck', 'draw')),
  reason TEXT,
  hunter_bet INTEGER DEFAULT 0,
  duck_bet INTEGER DEFAULT 0,
  hunter_coins_change INTEGER DEFAULT 0,
  duck_coins_change INTEGER DEFAULT 0,
  hunter_experience_gained INTEGER DEFAULT 0,
  duck_experience_gained INTEGER DEFAULT 0,
  shots_fired INTEGER DEFAULT 0,
  moves_made INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_game_history_session_id ON game_history(session_id);
CREATE INDEX IF NOT EXISTS idx_game_history_hunter_player ON game_history(hunter_player_id);
CREATE INDEX IF NOT EXISTS idx_game_history_duck_player ON game_history(duck_player_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at DESC);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_game_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_game_history_updated_at ON game_history;
CREATE TRIGGER trigger_update_game_history_updated_at
  BEFORE UPDATE ON game_history
  FOR EACH ROW
  EXECUTE FUNCTION update_game_history_updated_at();
