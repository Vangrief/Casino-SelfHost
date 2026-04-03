import { query } from '../config/database.js';

export async function updatePlayerStats(
  userId: string,
  gameType: 'blackjack' | 'poker',
  handsPlayed: number,
  handsWon: number,
  wagered: number,
  won: number,
  lost: number,
  isBlackjack = false,
  biggestWin = 0,
) {
  const netProfit = won - lost;

  // Update general stats
  await query(
    `UPDATE player_stats SET
      total_games = total_games + 1,
      total_hands = total_hands + $2,
      total_wins = total_wins + $3,
      total_wagered = total_wagered + $4,
      total_won = total_won + $5,
      total_lost = total_lost + $6,
      net_profit = net_profit + $7,
      biggest_win = GREATEST(biggest_win, $8),
      current_streak = CASE WHEN $7 > 0 THEN GREATEST(current_streak, 0) + 1 ELSE LEAST(current_streak, 0) - 1 END,
      best_streak = GREATEST(best_streak, CASE WHEN $7 > 0 THEN GREATEST(current_streak, 0) + 1 ELSE best_streak END),
      worst_streak = LEAST(worst_streak, CASE WHEN $7 < 0 THEN LEAST(current_streak, 0) - 1 ELSE worst_streak END),
      updated_at = NOW()
    WHERE user_id = $1`,
    [userId, handsPlayed, handsWon, wagered, won, lost, netProfit, biggestWin],
  );

  // Update game-specific stats
  if (gameType === 'blackjack') {
    await query(
      `UPDATE player_stats SET
        bj_hands = bj_hands + $2,
        bj_wins = bj_wins + $3,
        bj_blackjacks = bj_blackjacks + $4
      WHERE user_id = $1`,
      [userId, handsPlayed, handsWon, isBlackjack ? 1 : 0],
    );
  } else if (gameType === 'poker') {
    await query(
      `UPDATE player_stats SET
        poker_hands = poker_hands + $2,
        poker_wins = poker_wins + $3
      WHERE user_id = $1`,
      [userId, handsPlayed, handsWon],
    );
  }
}

export async function getPlayerStats(userId: string) {
  const result = await query(
    'SELECT * FROM player_stats WHERE user_id = $1',
    [userId],
  );
  return result.rows[0] || null;
}

export async function getLeaderboard(orderBy: 'net_profit' | 'total_wins' | 'total_games' = 'net_profit', limit = 10) {
  const validColumns = ['net_profit', 'total_wins', 'total_games'];
  const column = validColumns.includes(orderBy) ? orderBy : 'net_profit';

  const result = await query(
    `SELECT ps.*, u.username, u.display_name, u.avatar_url
     FROM player_stats ps
     JOIN users u ON u.id = ps.user_id
     ORDER BY ps.${column} DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}
