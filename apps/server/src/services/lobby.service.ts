import { randomUUID } from 'crypto';
import type { TableInfo, BlackjackTableConfig, PokerTableConfig, GameType } from '@casino/shared';
import { BLACKJACK_DEFAULTS, POKER_DEFAULTS } from '@casino/shared';
import { AppError } from '../middleware/error-handler.js';

// In-memory table store (persisted to Redis in a later phase)
const tables = new Map<string, TableInfo>();

export function createTable(
  gameType: GameType,
  name: string,
  config: Partial<BlackjackTableConfig | PokerTableConfig>,
  createdBy: { id: string; username: string; displayName: string },
): TableInfo {
  const id = randomUUID();

  const maxPlayers = gameType === 'blackjack' ? 5 : (config as PokerTableConfig).maxPlayers || 8;

  const fullConfig =
    gameType === 'blackjack'
      ? { ...BLACKJACK_DEFAULTS, ...config }
      : { ...POKER_DEFAULTS, ...config };

  const table: TableInfo = {
    id,
    gameType,
    name,
    players: [{ id: createdBy.id, username: createdBy.username, displayName: createdBy.displayName }],
    maxPlayers,
    config: fullConfig,
    status: 'waiting',
    createdBy: createdBy.id,
  };

  tables.set(id, table);
  return table;
}

export function joinTable(
  tableId: string,
  player: { id: string; username: string; displayName: string },
): TableInfo {
  const table = tables.get(tableId);
  if (!table) throw new AppError(404, 'Table not found');
  if (table.players.some((p) => p.id === player.id)) throw new AppError(400, 'Already at this table');
  if (table.players.length >= table.maxPlayers) throw new AppError(400, 'Table is full');

  table.players.push({ id: player.id, username: player.username, displayName: player.displayName });
  return table;
}

export function leaveTable(tableId: string, playerId: string): TableInfo | null {
  const table = tables.get(tableId);
  if (!table) return null;

  table.players = table.players.filter((p) => p.id !== playerId);

  // Remove table if empty
  if (table.players.length === 0) {
    tables.delete(tableId);
    return null;
  }

  return table;
}

export function getTable(tableId: string): TableInfo | undefined {
  return tables.get(tableId);
}

export function listTables(): TableInfo[] {
  return Array.from(tables.values());
}

export function removePlayerFromAllTables(playerId: string): string[] {
  const affectedTableIds: string[] = [];

  for (const [id, table] of tables) {
    if (table.players.some((p) => p.id === playerId)) {
      table.players = table.players.filter((p) => p.id !== playerId);
      if (table.players.length === 0) {
        tables.delete(id);
      }
      affectedTableIds.push(id);
    }
  }

  return affectedTableIds;
}
