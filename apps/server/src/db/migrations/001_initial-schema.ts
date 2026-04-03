import type { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Users
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    username: { type: 'varchar(32)', notNull: true, unique: true },
    display_name: { type: 'varchar(64)', notNull: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    avatar_url: { type: 'varchar(255)' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    last_seen_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });

  // Wallets
  pgm.createTable('wallets', {
    user_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    balance: { type: 'bigint', notNull: true, default: 10000 },
  });

  pgm.addConstraint('wallets', 'wallets_balance_check', {
    check: 'balance >= 0',
  });

  // Transactions
  pgm.createTable('transactions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    amount: { type: 'bigint', notNull: true },
    type: { type: 'varchar(32)', notNull: true },
    game_type: { type: 'varchar(32)' },
    game_id: { type: 'uuid' },
    description: { type: 'text' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });

  pgm.createIndex('transactions', ['user_id', 'created_at'], {
    name: 'idx_transactions_user',
  });

  // Game Sessions
  pgm.createTable('game_sessions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    game_type: { type: 'varchar(32)', notNull: true },
    status: { type: 'varchar(16)', notNull: true, default: "'active'" },
    config: { type: 'jsonb', notNull: true },
    started_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    ended_at: { type: 'timestamptz' },
    created_by: { type: 'uuid', references: 'users(id)' },
  });

  // Game Participants
  pgm.createTable('game_participants', {
    game_id: { type: 'uuid', notNull: true, references: 'game_sessions(id)', onDelete: 'CASCADE' },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    seat_number: { type: 'smallint' },
    buy_in: { type: 'bigint', notNull: true },
    cash_out: { type: 'bigint' },
    hands_played: { type: 'int', default: 0 },
    hands_won: { type: 'int', default: 0 },
    biggest_win: { type: 'bigint', default: 0 },
    joined_at: { type: 'timestamptz', default: pgm.func('NOW()') },
    left_at: { type: 'timestamptz' },
  });

  pgm.addConstraint('game_participants', 'game_participants_pkey', {
    primaryKey: ['game_id', 'user_id'],
  });

  // Player Stats
  pgm.createTable('player_stats', {
    user_id: { type: 'uuid', primaryKey: true, references: 'users(id)', onDelete: 'CASCADE' },
    total_games: { type: 'int', default: 0 },
    total_hands: { type: 'int', default: 0 },
    total_wins: { type: 'int', default: 0 },
    total_wagered: { type: 'bigint', default: 0 },
    total_won: { type: 'bigint', default: 0 },
    total_lost: { type: 'bigint', default: 0 },
    net_profit: { type: 'bigint', default: 0 },
    biggest_win: { type: 'bigint', default: 0 },
    bj_hands: { type: 'int', default: 0 },
    bj_wins: { type: 'int', default: 0 },
    bj_blackjacks: { type: 'int', default: 0 },
    poker_hands: { type: 'int', default: 0 },
    poker_wins: { type: 'int', default: 0 },
    poker_best_hand: { type: 'varchar(32)' },
    current_streak: { type: 'int', default: 0 },
    best_streak: { type: 'int', default: 0 },
    worst_streak: { type: 'int', default: 0 },
    updated_at: { type: 'timestamptz', default: pgm.func('NOW()') },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('player_stats');
  pgm.dropTable('game_participants');
  pgm.dropTable('game_sessions');
  pgm.dropTable('transactions');
  pgm.dropTable('wallets');
  pgm.dropTable('users');
}
