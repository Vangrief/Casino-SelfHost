import type { BlackjackClientState, BlackjackTableConfig, GameType, PokerClientState, PokerTableConfig, TableInfo } from './game.js';

// --- Client → Server Events ---

export interface LobbyClientEvents {
  'lobby:create_table': { gameType: GameType; name: string; config: BlackjackTableConfig | PokerTableConfig };
  'lobby:join_table': { tableId: string };
  'lobby:leave_table': { tableId: string };
  'lobby:chat': { message: string };
}

export interface BlackjackClientEvents {
  'bj:place_bet': { amount: number };
  'bj:hit': Record<string, never>;
  'bj:stand': Record<string, never>;
  'bj:double_down': Record<string, never>;
  'bj:split': Record<string, never>;
  'bj:insurance': { accept: boolean };
}

export interface PokerClientEvents {
  'poker:fold': Record<string, never>;
  'poker:check': Record<string, never>;
  'poker:call': Record<string, never>;
  'poker:raise': { amount: number };
  'poker:all_in': Record<string, never>;
}

// --- Server → Client Events ---

export interface LobbyServerEvents {
  'lobby:tables_update': TableInfo[];
  'lobby:player_joined': { tableId: string; player: { id: string; username: string; displayName: string } };
  'lobby:player_left': { tableId: string; player: { id: string; username: string } };
  'lobby:chat_message': { from: string; displayName: string; message: string; timestamp: string };
  'lobby:players_online': { count: number; players: { id: string; username: string; displayName: string }[] };
}

export interface GameServerEvents {
  'game:state_update': BlackjackClientState | PokerClientState;
  'game:player_action': { playerId: string; action: string; data?: Record<string, unknown> };
  'game:phase_change': { newPhase: string };
  'game:hand_result': { winners: { playerId: string; amount: number }[]; payouts: { playerId: string; amount: number }[] };
  'game:error': { code: string; message: string };
}

export interface WalletServerEvents {
  'wallet:balance_update': { balance: number };
}

// --- DTOs ---

export interface UserDTO {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  lastSeenAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserDTO & { balance: number };
}

export interface TransactionDTO {
  id: string;
  amount: number;
  type: string;
  gameType: string | null;
  gameId: string | null;
  description: string | null;
  createdAt: string;
}

export interface WalletDTO {
  balance: number;
  transactions: TransactionDTO[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
