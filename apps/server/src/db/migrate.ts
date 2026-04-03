import { pool } from '../config/database.js';

const MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS wallets (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance BIGINT NOT NULL DEFAULT 10000,
    CONSTRAINT wallets_balance_check CHECK (balance >= 0)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL,
    game_type VARCHAR(32),
    game_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at);

  CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type VARCHAR(32) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    config JSONB NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS game_participants (
    game_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seat_number SMALLINT,
    buy_in BIGINT NOT NULL,
    cash_out BIGINT,
    hands_played INT DEFAULT 0,
    hands_won INT DEFAULT 0,
    biggest_win BIGINT DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    PRIMARY KEY (game_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS player_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_games INT DEFAULT 0,
    total_hands INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    total_wagered BIGINT DEFAULT 0,
    total_won BIGINT DEFAULT 0,
    total_lost BIGINT DEFAULT 0,
    net_profit BIGINT DEFAULT 0,
    biggest_win BIGINT DEFAULT 0,
    bj_hands INT DEFAULT 0,
    bj_wins INT DEFAULT 0,
    bj_blackjacks INT DEFAULT 0,
    poker_hands INT DEFAULT 0,
    poker_wins INT DEFAULT 0,
    poker_best_hand VARCHAR(32),
    current_streak INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    worst_streak INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

export async function runMigrations(): Promise<void> {
  console.log('[db] Running migrations...');
  await pool.query(MIGRATION_SQL);
  console.log('[db] Migrations complete.');
}
