import { getClient, query } from '../config/database.js';
import { AppError } from '../middleware/error-handler.js';

export async function getBalance(userId: string): Promise<number> {
  const result = await query<{ balance: string }>(
    'SELECT balance FROM wallets WHERE user_id = $1',
    [userId],
  );
  if (result.rows.length === 0) {
    throw new AppError(404, 'Wallet not found');
  }
  return parseInt(result.rows[0].balance, 10);
}

export async function debit(
  userId: string,
  amount: number,
  type: string,
  gameType?: string,
  gameId?: string,
  description?: string,
): Promise<number> {
  if (amount <= 0) throw new AppError(400, 'Amount must be positive');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const walletResult = await client.query<{ balance: string }>(
      'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [userId],
    );
    if (walletResult.rows.length === 0) {
      throw new AppError(404, 'Wallet not found');
    }

    const currentBalance = parseInt(walletResult.rows[0].balance, 10);
    if (currentBalance < amount) {
      throw new AppError(400, 'Insufficient balance');
    }

    const newBalance = currentBalance - amount;

    await client.query(
      'UPDATE wallets SET balance = $1 WHERE user_id = $2',
      [newBalance, userId],
    );

    await client.query(
      `INSERT INTO transactions (user_id, amount, type, game_type, game_id, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, -amount, type, gameType || null, gameId || null, description || null],
    );

    await client.query('COMMIT');
    return newBalance;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function credit(
  userId: string,
  amount: number,
  type: string,
  gameType?: string,
  gameId?: string,
  description?: string,
): Promise<number> {
  if (amount <= 0) throw new AppError(400, 'Amount must be positive');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const walletResult = await client.query<{ balance: string }>(
      'SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [userId],
    );
    if (walletResult.rows.length === 0) {
      throw new AppError(404, 'Wallet not found');
    }

    const currentBalance = parseInt(walletResult.rows[0].balance, 10);
    const newBalance = currentBalance + amount;

    await client.query(
      'UPDATE wallets SET balance = $1 WHERE user_id = $2',
      [newBalance, userId],
    );

    await client.query(
      `INSERT INTO transactions (user_id, amount, type, game_type, game_id, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, amount, type, gameType || null, gameId || null, description || null],
    );

    await client.query('COMMIT');
    return newBalance;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export interface TransactionRow {
  id: string;
  user_id: string;
  amount: string;
  type: string;
  game_type: string | null;
  game_id: string | null;
  description: string | null;
  created_at: Date;
}

export async function getTransactions(
  userId: string,
  page: number,
  pageSize: number,
  type?: string,
  gameType?: string,
) {
  const conditions = ['user_id = $1'];
  const params: unknown[] = [userId];
  let paramIndex = 2;

  if (type) {
    conditions.push(`type = $${paramIndex++}`);
    params.push(type);
  }
  if (gameType) {
    conditions.push(`game_type = $${paramIndex++}`);
    params.push(gameType);
  }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * pageSize;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM transactions WHERE ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await query<TransactionRow>(
    `SELECT * FROM transactions WHERE ${where} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, pageSize, offset],
  );

  return {
    data: dataResult.rows.map((row) => ({
      id: row.id,
      amount: parseInt(row.amount, 10),
      type: row.type,
      gameType: row.game_type,
      gameId: row.game_id,
      description: row.description,
      createdAt: row.created_at.toISOString(),
    })),
    total,
    page,
    pageSize,
  };
}
