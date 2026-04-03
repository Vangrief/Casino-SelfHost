import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { BCRYPT_ROUNDS, JWT_EXPIRY, STARTING_CHIPS } from '@casino/shared';
import { query, getClient } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/error-handler.js';

export interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  avatar_url: string | null;
  created_at: Date;
  last_seen_at: Date;
}

export async function registerUser(username: string, displayName: string, password: string) {
  const existing = await query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) {
    throw new AppError(409, 'Username already taken');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const userResult = await client.query<UserRow>(
      `INSERT INTO users (username, display_name, password_hash)
       VALUES ($1, $2, $3) RETURNING *`,
      [username, displayName, passwordHash],
    );
    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO wallets (user_id, balance) VALUES ($1, $2)`,
      [user.id, STARTING_CHIPS],
    );

    await client.query(
      `INSERT INTO player_stats (user_id) VALUES ($1)`,
      [user.id],
    );

    await client.query('COMMIT');

    const token = jwt.sign({ userId: user.id, username: user.username }, env.JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at.toISOString(),
        lastSeenAt: user.last_seen_at.toISOString(),
        balance: STARTING_CHIPS,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function loginUser(username: string, password: string) {
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE username = $1',
    [username],
  );

  if (result.rows.length === 0) {
    throw new AppError(401, 'Invalid username or password');
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError(401, 'Invalid username or password');
  }

  await query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [user.id]);

  const walletResult = await query<{ balance: string }>(
    'SELECT balance FROM wallets WHERE user_id = $1',
    [user.id],
  );
  const balance = parseInt(walletResult.rows[0]?.balance || '0', 10);

  const token = jwt.sign({ userId: user.id, username: user.username }, env.JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at.toISOString(),
      lastSeenAt: user.last_seen_at.toISOString(),
      balance,
    },
  };
}

export async function getUserById(userId: string) {
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE id = $1',
    [userId],
  );
  if (result.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const user = result.rows[0];

  const walletResult = await query<{ balance: string }>(
    'SELECT balance FROM wallets WHERE user_id = $1',
    [user.id],
  );
  const balance = parseInt(walletResult.rows[0]?.balance || '0', 10);

  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at.toISOString(),
    lastSeenAt: user.last_seen_at.toISOString(),
    balance,
  };
}
