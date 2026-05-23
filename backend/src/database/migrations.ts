import { query } from './db.js';
import { logger } from '../utils/logger.js';

export async function runMigrations() {
  logger.info('Running database migrations...');

  const migrations = [
    // Users table
    `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supabase_user_id UUID UNIQUE,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone_number VARCHAR(20),
      username VARCHAR(100) UNIQUE NOT NULL,
      auth_provider VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255),
      balance DECIMAL(18, 2) NOT NULL DEFAULT 0,
      total_wagered DECIMAL(18, 2) NOT NULL DEFAULT 0,
      total_won DECIMAL(18, 2) NOT NULL DEFAULT 0,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      verification_status VARCHAR(50) NOT NULL DEFAULT 'unverified',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_user_id UUID;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);
    `,

    // Games table
    `
    CREATE TABLE IF NOT EXISTS games (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'waiting',
      entry_fee DECIMAL(18, 2) NOT NULL,
      pot DECIMAL(18, 2) NOT NULL DEFAULT 0,
      winner_id UUID REFERENCES users(id),
      max_players INT NOT NULL DEFAULT 5,
      round_data JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      started_at TIMESTAMP,
      ended_at TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
    CREATE INDEX IF NOT EXISTS idx_games_type ON games(type);
    `,

    // Game players junction table
    `
    CREATE TABLE IF NOT EXISTS game_players (
      game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (game_id, player_id)
    );
    CREATE INDEX IF NOT EXISTS idx_game_players_player ON game_players(player_id);
    `,

    // Tournaments table
    `
    CREATE TABLE IF NOT EXISTS tournaments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      status VARCHAR(50) NOT NULL DEFAULT 'registration',
      entry_fee DECIMAL(18, 2) NOT NULL,
      max_players INT NOT NULL DEFAULT 100,
      current_players INT NOT NULL DEFAULT 0,
      total_pot DECIMAL(18, 2) NOT NULL DEFAULT 0,
      current_round INT NOT NULL DEFAULT 0,
      winner_id UUID REFERENCES users(id),
      bracket_data JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      started_at TIMESTAMP,
      ended_at TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
    `,

    // Tournament players registration
    `
    CREATE TABLE IF NOT EXISTS tournament_players (
      tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      position INT,
      joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (tournament_id, player_id)
    );
    CREATE INDEX IF NOT EXISTS idx_tournament_players_player ON tournament_players(player_id);
    `,

    // Transactions table
    `
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(18, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      payment_method VARCHAR(50) NOT NULL,
      reference VARCHAR(255) UNIQUE,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    `,

    // Escrow table
    `
    CREATE TABLE IF NOT EXISTS escrow (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entity_type VARCHAR(50) NOT NULL,
      entity_id UUID NOT NULL,
      amount DECIMAL(18, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'locked',
      released_to VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      released_at TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_escrow_user ON escrow(user_id);
    CREATE INDEX IF NOT EXISTS idx_escrow_entity ON escrow(entity_type, entity_id);
    `,

    // Rate limiting table
    `
    CREATE TABLE IF NOT EXISTS rate_limits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(255) NOT NULL,
      count INT NOT NULL DEFAULT 1,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
    CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);
    `,
  ];

  try {
    for (const migration of migrations) {
      await query(migration);
    }
    logger.info('Migrations completed successfully');
  } catch (err) {
    logger.error('Migration error:', err);
    throw err;
  }
}
