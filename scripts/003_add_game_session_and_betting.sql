-- Добавление полей для ID сессии игры и ставок
ALTER TABLE game_history 
ADD COLUMN IF NOT EXISTS game_session_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS bet_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS game_reason TEXT;

-- Создание индекса для game_session_id
CREATE INDEX IF NOT EXISTS idx_game_history_session_id ON game_history(game_session_id);

-- Обновление существующих записей с уникальными session_id
UPDATE game_history SET game_session_id = gen_random_uuid() WHERE game_session_id IS NULL;
