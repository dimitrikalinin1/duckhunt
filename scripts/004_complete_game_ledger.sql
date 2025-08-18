-- Complete game ledger system with betting and balance tracking

-- Drop existing tables if they exist
drop table if exists game_history cascade;
drop table if exists transactions cascade;
drop table if exists game_participants cascade;
drop table if exists games cascade;

-- players table (update existing or create)
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  balance_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  -- Add existing columns for compatibility
  hunter_level integer default 1,
  duck_level integer default 1,
  hunter_experience integer default 0,
  duck_experience integer default 0
);

-- games table
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('running','ended')),
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  winner_player_id uuid references players(id),
  loser_player_id uuid references players(id),
  lobby_id text,
  session_id text unique
);

-- game_participants: per-player bet and result
create table if not exists game_participants (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  player_id uuid not null references players(id),
  bet_cents bigint not null check (bet_cents >= 0),
  result text check (result in ('pending','win','lose')),
  role text check (role in ('hunter','duck')),
  unique (game_id, player_id)
);

-- transactions: immutable audit ledger
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id),
  game_id uuid references games(id),
  amount_cents bigint not null, -- + credit, - debit
  reason text not null,         -- 'bet_settlement'
  created_at timestamptz not null default now()
);

-- indexes
create index if not exists idx_games_status_created on games(status, created_at desc);
create index if not exists idx_tx_player_created on transactions(player_id, created_at desc);
create index if not exists idx_gp_game on game_participants(game_id);
create index if not exists idx_games_session on games(session_id);

-- RLS policies
alter table players enable row level security;
alter table games enable row level security;
alter table game_participants enable row level security;
alter table transactions enable row level security;

-- Drop existing policies if they exist
drop policy if exists "players read own" on players;
drop policy if exists "players update own" on players;
drop policy if exists "games readable" on games;
drop policy if exists "gp readable" on game_participants;
drop policy if exists "tx read own" on transactions;

create policy "players readable" on players for select using (true);
create policy "players update own" on players for update using (true);
create policy "games readable" on games for select using (true);
create policy "games insert" on games for insert with check (true);
create policy "games update" on games for update using (true);
create policy "gp readable" on game_participants for select using (true);
create policy "gp insert" on game_participants for insert with check (true);
create policy "gp update" on game_participants for update using (true);
create policy "tx readable" on transactions for select using (true);
create policy "tx insert" on transactions for insert with check (true);

-- RPC: create game + insert participants atomically
create or replace function create_game_with_bets(
  p_player_ids uuid[],
  p_bets bigint[],
  p_roles text[] default null,
  p_lobby_id text default null,
  p_session_id text default null
) returns json
language plpgsql
as $$
declare
  g_id uuid := gen_random_uuid();
  final_session_id text := coalesce(p_session_id, g_id::text);
begin
  if array_length(p_player_ids,1) <> 2 or array_length(p_bets,1) <> 2 then
    raise exception 'Exactly 2 players and 2 bets required';
  end if;

  insert into games(id, status, lobby_id, session_id) 
  values (g_id, 'running', p_lobby_id, final_session_id);

  insert into game_participants(game_id, player_id, bet_cents, result, role)
  values (g_id, p_player_ids[1], p_bets[1], 'pending', coalesce(p_roles[1], 'hunter')),
         (g_id, p_player_ids[2], p_bets[2], 'pending', coalesce(p_roles[2], 'duck'));

  return json_build_object('game_id', g_id, 'status', 'running', 'session_id', final_session_id);
end;
$$;

-- RPC: settle game atomically & idempotently
create or replace function settle_game(
  p_game_id uuid,
  p_winner uuid,
  p_loser uuid
) returns void
language plpgsql
as $$
declare
  v_winner_bet bigint;
  v_loser_bet  bigint;
  v_already_ended int;
begin
  -- Lock game to avoid concurrent endings
  perform 1 from games where id = p_game_id for update;

  -- Idempotency: exit if already ended
  select count(*) into v_already_ended from games where id = p_game_id and status = 'ended';
  if v_already_ended > 0 then
    return;
  end if;

  -- Validate different players and membership
  if p_winner = p_loser then
    raise exception 'winner and loser must be different';
  end if;

  -- Lock player rows to avoid balance races
  perform 1 from players where id = p_winner for update;
  perform 1 from players where id = p_loser  for update;

  -- Get bets
  select bet_cents into v_winner_bet from game_participants where game_id = p_game_id and player_id = p_winner;
  select bet_cents into v_loser_bet  from game_participants where game_id = p_game_id and player_id = p_loser;

  if v_winner_bet is null or v_loser_bet is null then
    raise exception 'Missing bets for winner/loser in this game';
  end if;

  -- Settle: credit winner by loser bet, debit loser by same amount
  update players set balance_cents = balance_cents + v_loser_bet where id = p_winner;
  update players set balance_cents = balance_cents - v_loser_bet where id = p_loser;

  -- Audit
  insert into transactions (player_id, game_id, amount_cents, reason)
  values (p_winner, p_game_id,  v_loser_bet,  'bet_settlement'),
         (p_loser,  p_game_id, -v_loser_bet, 'bet_settlement');

  -- Mark results
  update game_participants set result = 'win'  where game_id = p_game_id and player_id = p_winner;
  update game_participants set result = 'lose' where game_id = p_game_id and player_id = p_loser;

  -- Close game
  update games
  set status = 'ended',
      ended_at = now(),
      winner_player_id = p_winner,
      loser_player_id  = p_loser
  where id = p_game_id;
end;
$$;

-- RPC: get games with participants for admin/history
create or replace function get_games_with_participants(p_player_id uuid default null)
returns table (
  game_id uuid,
  status text,
  created_at timestamptz,
  ended_at timestamptz,
  winner_username text,
  loser_username text,
  participants json
)
language plpgsql
as $$
begin
  return query
  select 
    g.id as game_id,
    g.status,
    g.created_at,
    g.ended_at,
    wp.username as winner_username,
    lp.username as loser_username,
    json_agg(
      json_build_object(
        'player_id', gp.player_id,
        'username', p.username,
        'bet_cents', gp.bet_cents,
        'result', gp.result,
        'role', gp.role
      )
    ) as participants
  from games g
  left join players wp on g.winner_player_id = wp.id
  left join players lp on g.loser_player_id = lp.id
  join game_participants gp on g.id = gp.game_id
  join players p on gp.player_id = p.id
  where (p_player_id is null or gp.player_id = p_player_id)
  group by g.id, g.status, g.created_at, g.ended_at, wp.username, lp.username
  order by g.created_at desc;
end;
$$;
