import type { Server, Socket } from 'socket.io';
import { bjPlaceBetSchema, bjInsuranceSchema } from '@casino/shared';
import type { BlackjackTableConfig } from '@casino/shared';
import type { AuthPayload } from '../middleware/auth.js';
import { BlackjackGame } from '../games/blackjack/blackjack-game.js';
import * as walletService from '../services/wallet.service.js';
import { query } from '../config/database.js';

interface BJSocket extends Socket {
  data: {
    user: AuthPayload;
    tableId?: string;
  };
}

// Active games per table
const activeGames = new Map<string, BlackjackGame>();

// Track which table each player is in
const playerTables = new Map<string, string>();

// Bet tracking: debits made for initial bets (to avoid double-debit)
const playerBetDebited = new Map<string, Set<string>>(); // tableId -> Set<playerId>

export function getOrCreateGame(tableId: string, config?: Partial<BlackjackTableConfig>): BlackjackGame {
  let game = activeGames.get(tableId);
  if (!game) {
    game = new BlackjackGame(config);
    activeGames.set(tableId, game);
  }
  return game;
}

function broadcastState(io: Server, tableId: string, game: BlackjackGame) {
  const state = game.getClientState();
  state.id = tableId;
  io.of('/blackjack').to(`bj:${tableId}`).emit('game:state_update', state);
}

async function processPayouts(io: Server, tableId: string, game: BlackjackGame) {
  const netPayouts = game.getNetPayouts();
  const payoutEntries = game.getPayouts();

  const winners: { playerId: string; amount: number }[] = [];
  const payouts: { playerId: string; amount: number }[] = [];

  for (const [playerId, net] of netPayouts) {
    // Get the total bet that was debited
    const totalBet = game.getTotalBet(playerId);

    if (net > 0) {
      // Player won: credit bet + winnings
      await walletService.credit(playerId, totalBet + net, 'win', 'blackjack');
      winners.push({ playerId, amount: net });
    } else if (net === 0) {
      // Push: return the bet
      await walletService.credit(playerId, totalBet, 'cash_out', 'blackjack');
    }
    // If net < 0, the debit already happened (bet was taken at deal time)
    // But if player lost less than they bet (partial from split), adjust
    // Actually, total bet was already debited, so loss is already accounted for

    payouts.push({ playerId, amount: net });

    // Update player balance via socket
    const balance = await walletService.getBalance(playerId);
    io.of('/blackjack').to(`bj:${tableId}`).emit('wallet:balance_update', { balance, playerId });
  }

  io.of('/blackjack').to(`bj:${tableId}`).emit('game:hand_result', {
    winners,
    payouts,
    details: payoutEntries,
  });

  // Clear bet tracking for this table
  playerBetDebited.delete(tableId);

  // Auto-reset for new round after delay
  setTimeout(() => {
    game.resetForNewRound();
    broadcastState(io, tableId, game);
  }, 5000);
}

export function setupBlackjackNamespace(io: Server) {
  const bjNamespace = io.of('/blackjack');

  bjNamespace.on('connection', async (socket: BJSocket) => {
    const { userId, username } = socket.data.user;

    // Fetch display name
    const result = await query<{ display_name: string; avatar_url: string | null }>(
      'SELECT display_name, avatar_url FROM users WHERE id = $1',
      [userId],
    );
    const displayName = result.rows[0]?.display_name || username;
    const avatarUrl = result.rows[0]?.avatar_url || null;

    // Join table (tableId sent from client on connect)
    socket.on('bj:join_table', (data: { tableId: string; config?: Partial<BlackjackTableConfig> }) => {
      const { tableId } = data;
      socket.join(`bj:${tableId}`);
      socket.data.tableId = tableId;
      playerTables.set(userId, tableId);

      const game = getOrCreateGame(tableId, data.config);
      const seatNumber = game.getPlayerCount();
      game.addPlayer({ id: userId, username, displayName, avatarUrl }, seatNumber);

      broadcastState(io, tableId, game);
      console.log(`[BJ] ${username} joined table ${tableId}`);
    });

    // Place bet
    socket.on('bj:place_bet', async (data: unknown) => {
      const parsed = bjPlaceBetSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('game:error', { code: 'INVALID_INPUT', message: 'Invalid bet amount' });
        return;
      }

      const tableId = socket.data.tableId;
      if (!tableId) return;

      const game = activeGames.get(tableId);
      if (!game) return;

      // Check balance
      const balance = await walletService.getBalance(userId);
      if (balance < parsed.data.amount) {
        socket.emit('game:error', { code: 'INSUFFICIENT_FUNDS', message: 'Not enough chips' });
        return;
      }

      const result = game.placeBet(userId, parsed.data.amount);
      if (!result.success) {
        socket.emit('game:error', { code: 'BET_FAILED', message: result.error! });
        return;
      }

      // Debit the bet immediately
      const newBalance = await walletService.debit(userId, parsed.data.amount, 'buy_in', 'blackjack');
      socket.emit('wallet:balance_update', { balance: newBalance });

      // Track that we debited this player
      if (!playerBetDebited.has(tableId)) {
        playerBetDebited.set(tableId, new Set());
      }
      playerBetDebited.get(tableId)!.add(userId);

      broadcastState(io, tableId, game);

      // Auto-deal when all bets are placed
      if (game.allBetsPlaced()) {
        game.deal();
        broadcastState(io, tableId, game);

        // If game went straight to payout (e.g., all blackjacks)
        if (game.getPhase() === 'bj:payout') {
          await processPayouts(io, tableId, game);
        }
      }
    });

    // Hit
    socket.on('bj:hit', async () => {
      const tableId = socket.data.tableId;
      if (!tableId) return;

      const game = activeGames.get(tableId);
      if (!game) return;

      const result = game.hit(userId);
      if (!result.success) {
        socket.emit('game:error', { code: 'ACTION_FAILED', message: result.error! });
        return;
      }

      broadcastState(io, tableId, game);

      if (game.getPhase() === 'bj:payout') {
        await processPayouts(io, tableId, game);
      }
    });

    // Stand
    socket.on('bj:stand', async () => {
      const tableId = socket.data.tableId;
      if (!tableId) return;

      const game = activeGames.get(tableId);
      if (!game) return;

      const result = game.stand(userId);
      if (!result.success) {
        socket.emit('game:error', { code: 'ACTION_FAILED', message: result.error! });
        return;
      }

      broadcastState(io, tableId, game);

      if (game.getPhase() === 'bj:payout') {
        await processPayouts(io, tableId, game);
      }
    });

    // Double Down
    socket.on('bj:double_down', async () => {
      const tableId = socket.data.tableId;
      if (!tableId) return;

      const game = activeGames.get(tableId);
      if (!game) return;

      const result = game.doubleDown(userId);
      if (!result.success) {
        socket.emit('game:error', { code: 'ACTION_FAILED', message: result.error! });
        return;
      }

      // Debit the additional bet
      if (result.additionalBet) {
        const balance = await walletService.getBalance(userId);
        if (balance < result.additionalBet) {
          socket.emit('game:error', { code: 'INSUFFICIENT_FUNDS', message: 'Not enough chips to double down' });
          return;
        }
        const newBalance = await walletService.debit(userId, result.additionalBet, 'buy_in', 'blackjack');
        socket.emit('wallet:balance_update', { balance: newBalance });
      }

      broadcastState(io, tableId, game);

      if (game.getPhase() === 'bj:payout') {
        await processPayouts(io, tableId, game);
      }
    });

    // Split
    socket.on('bj:split', async () => {
      const tableId = socket.data.tableId;
      if (!tableId) return;

      const game = activeGames.get(tableId);
      if (!game) return;

      const result = game.split(userId);
      if (!result.success) {
        socket.emit('game:error', { code: 'ACTION_FAILED', message: result.error! });
        return;
      }

      // Debit the additional bet for the split hand
      if (result.additionalBet) {
        const balance = await walletService.getBalance(userId);
        if (balance < result.additionalBet) {
          socket.emit('game:error', { code: 'INSUFFICIENT_FUNDS', message: 'Not enough chips to split' });
          return;
        }
        const newBalance = await walletService.debit(userId, result.additionalBet, 'buy_in', 'blackjack');
        socket.emit('wallet:balance_update', { balance: newBalance });
      }

      broadcastState(io, tableId, game);
    });

    // Insurance
    socket.on('bj:insurance', async (data: unknown) => {
      const parsed = bjInsuranceSchema.safeParse(data);
      if (!parsed.success) return;

      const tableId = socket.data.tableId;
      if (!tableId) return;

      const game = activeGames.get(tableId);
      if (!game) return;

      const result = game.insurance(userId, parsed.data.accept);
      if (!result.success) {
        socket.emit('game:error', { code: 'ACTION_FAILED', message: result.error! });
        return;
      }

      if (result.insuranceBet) {
        const newBalance = await walletService.debit(userId, result.insuranceBet, 'buy_in', 'blackjack');
        socket.emit('wallet:balance_update', { balance: newBalance });
      }

      broadcastState(io, tableId, game);
    });

    // Leave table
    socket.on('bj:leave_table', () => {
      const tableId = socket.data.tableId;
      if (!tableId) return;

      const game = activeGames.get(tableId);
      if (game) {
        game.removePlayer(userId);
        if (game.getPlayerCount() === 0) {
          activeGames.delete(tableId);
        } else {
          broadcastState(io, tableId, game);
        }
      }

      socket.leave(`bj:${tableId}`);
      socket.data.tableId = undefined;
      playerTables.delete(userId);
    });

    // Disconnect
    socket.on('disconnect', () => {
      const tableId = playerTables.get(userId);
      if (tableId) {
        const game = activeGames.get(tableId);
        if (game) {
          game.removePlayer(userId);
          if (game.getPlayerCount() === 0) {
            activeGames.delete(tableId);
          } else {
            broadcastState(io, tableId, game);
          }
        }
        playerTables.delete(userId);
      }
      console.log(`[BJ] ${username} disconnected`);
    });
  });

  return bjNamespace;
}
