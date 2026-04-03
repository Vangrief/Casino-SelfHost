import type { Server, Socket } from 'socket.io';
import { pokerRaiseSchema } from '@casino/shared';
import type { PokerTableConfig } from '@casino/shared';
import type { AuthPayload } from '../middleware/auth.js';
import { PokerGame } from '../games/poker/poker-game.js';
import * as walletService from '../services/wallet.service.js';
import { query } from '../config/database.js';

interface PokerSocket extends Socket {
  data: {
    user: AuthPayload;
    tableId?: string;
  };
}

const activeGames = new Map<string, PokerGame>();
const playerTables = new Map<string, string>();

function getOrCreateGame(tableId: string, config?: Partial<PokerTableConfig>): PokerGame {
  let game = activeGames.get(tableId);
  if (!game) {
    game = new PokerGame(config);
    activeGames.set(tableId, game);
  }
  return game;
}

function broadcastState(io: Server, tableId: string, game: PokerGame) {
  const namespace = io.of('/poker');
  const room = namespace.adapter.rooms.get(`poker:${tableId}`);
  if (!room) return;

  // Send filtered state per player
  for (const socketId of room) {
    const socket = namespace.sockets.get(socketId);
    if (!socket) continue;
    const userId = (socket as PokerSocket).data.user?.userId;
    const state = game.getClientState(userId);
    state.id = tableId;
    socket.emit('game:state_update', state);
  }
}

function broadcastPayouts(io: Server, tableId: string, game: PokerGame) {
  const payouts = game.getPayouts();
  const showdownHands = game.getShowdownHands();

  const winners = payouts.filter((p) => p.amount > 0);
  const handDetails: Record<string, string> = {};
  for (const [id, hand] of showdownHands) {
    handDetails[id] = hand.name;
  }

  io.of('/poker').to(`poker:${tableId}`).emit('game:hand_result', {
    winners: winners.map((w) => ({ playerId: w.playerId, amount: w.amount })),
    payouts: payouts.map((p) => ({ playerId: p.playerId, amount: p.amount })),
    hands: handDetails,
  });
}

async function settleWallets(io: Server, tableId: string, game: PokerGame) {
  broadcastPayouts(io, tableId, game);

  // Broadcast updated chip counts (already in game state)
  broadcastState(io, tableId, game);

  // Auto-start next hand after delay
  setTimeout(() => {
    if (game.canStartHand()) {
      game.resetForNewHand();
      game.startHand();

      game.setTimeoutCallback(() => {
        broadcastState(io, tableId, game);
      });

      broadcastState(io, tableId, game);
    } else {
      game.resetForNewHand();
      broadcastState(io, tableId, game);
    }
  }, 5000);
}

export function setupPokerNamespace(io: Server) {
  const pokerNs = io.of('/poker');

  pokerNs.on('connection', async (socket: PokerSocket) => {
    const { userId, username } = socket.data.user;

    const result = await query<{ display_name: string; avatar_url: string | null }>(
      'SELECT display_name, avatar_url FROM users WHERE id = $1',
      [userId],
    );
    const displayName = result.rows[0]?.display_name || username;
    const avatarUrl = result.rows[0]?.avatar_url || null;

    // Join table
    socket.on('poker:join_table', async (data: { tableId: string; buyIn: number; config?: Partial<PokerTableConfig> }) => {
      const { tableId, buyIn } = data;

      // Verify balance
      const balance = await walletService.getBalance(userId);
      if (balance < buyIn) {
        socket.emit('game:error', { code: 'INSUFFICIENT_FUNDS', message: 'Not enough chips for buy-in' });
        return;
      }

      socket.join(`poker:${tableId}`);
      socket.data.tableId = tableId;
      playerTables.set(userId, tableId);

      const game = getOrCreateGame(tableId, data.config);
      const seatNumber = game.getPlayerCount();

      const added = game.addPlayer(
        { id: userId, username, displayName, avatarUrl },
        seatNumber,
        buyIn,
      );

      if (!added) {
        socket.emit('game:error', { code: 'JOIN_FAILED', message: 'Could not join table' });
        return;
      }

      // Debit buy-in from wallet
      await walletService.debit(userId, buyIn, 'buy_in', 'poker');

      // Auto-start if enough players and game is waiting
      if (game.getPhase() === 'poker:waiting' && game.canStartHand()) {
        game.startHand();
        game.setTimeoutCallback(() => {
          broadcastState(io, tableId, game);
        });
      }

      broadcastState(io, tableId, game);
      console.log(`[Poker] ${username} joined table ${tableId} (buy-in: ${buyIn})`);
    });

    // Fold
    socket.on('poker:fold', async () => {
      const tableId = socket.data.tableId;
      if (!tableId) return;
      const game = activeGames.get(tableId);
      if (!game) return;

      const result = game.fold(userId);
      if (!result.success) {
        socket.emit('game:error', { code: 'ACTION_FAILED', message: result.error! });
        return;
      }

      broadcastState(io, tableId, game);

      if (game.getPhase() === 'poker:showdown') {
        await settleWallets(io, tableId, game);
      }
    });

    // Check
    socket.on('poker:check', async () => {
      const tableId = socket.data.tableId;
      if (!tableId) return;
      const game = activeGames.get(tableId);
      if (!game) return;

      const result = game.check(userId);
      if (!result.success) {
        socket.emit('game:error', { code: 'ACTION_FAILED', message: result.error! });
        return;
      }

      broadcastState(io, tableId, game);

      if (game.getPhase() === 'poker:showdown') {
        await settleWallets(io, tableId, game);
      }
    });

    // Call
    socket.on('poker:call', async () => {
      const tableId = socket.data.tableId;
      if (!tableId) return;
      const game = activeGames.get(tableId);
      if (!game) return;

      const result = game.call(userId);
      if (!result.success) {
        socket.emit('game:error', { code: 'ACTION_FAILED', message: result.error! });
        return;
      }

      broadcastState(io, tableId, game);

      if (game.getPhase() === 'poker:showdown') {
        await settleWallets(io, tableId, game);
      }
    });

    // Raise
    socket.on('poker:raise', async (data: unknown) => {
      const parsed = pokerRaiseSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('game:error', { code: 'INVALID_INPUT', message: 'Invalid raise amount' });
        return;
      }

      const tableId = socket.data.tableId;
      if (!tableId) return;
      const game = activeGames.get(tableId);
      if (!game) return;

      const result = game.raise(userId, parsed.data.amount);
      if (!result.success) {
        socket.emit('game:error', { code: 'ACTION_FAILED', message: result.error! });
        return;
      }

      broadcastState(io, tableId, game);

      if (game.getPhase() === 'poker:showdown') {
        await settleWallets(io, tableId, game);
      }
    });

    // All-in
    socket.on('poker:all_in', async () => {
      const tableId = socket.data.tableId;
      if (!tableId) return;
      const game = activeGames.get(tableId);
      if (!game) return;

      const result = game.allIn(userId);
      if (!result.success) {
        socket.emit('game:error', { code: 'ACTION_FAILED', message: result.error! });
        return;
      }

      broadcastState(io, tableId, game);

      if (game.getPhase() === 'poker:showdown') {
        await settleWallets(io, tableId, game);
      }
    });

    // Leave table
    socket.on('poker:leave_table', async () => {
      const tableId = socket.data.tableId;
      if (!tableId) return;
      const game = activeGames.get(tableId);

      if (game && game.hasPlayer(userId)) {
        // Cash out remaining chips
        const chips = game.getPlayerChips(userId);
        if (chips > 0) {
          await walletService.credit(userId, chips, 'cash_out', 'poker');
        }

        game.removePlayer(userId);
        if (game.getPlayerCount() === 0) {
          activeGames.delete(tableId);
        } else {
          broadcastState(io, tableId, game);
        }
      }

      socket.leave(`poker:${tableId}`);
      socket.data.tableId = undefined;
      playerTables.delete(userId);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      const tableId = playerTables.get(userId);
      if (tableId) {
        const game = activeGames.get(tableId);
        if (game && game.hasPlayer(userId)) {
          // Mark disconnected but don't remove immediately
          // Auto-fold will handle it via timer
          const chips = game.getPlayerChips(userId);
          game.removePlayer(userId);

          if (chips > 0) {
            await walletService.credit(userId, chips, 'cash_out', 'poker');
          }

          if (game.getPlayerCount() === 0) {
            activeGames.delete(tableId);
          } else {
            broadcastState(io, tableId, game);
          }
        }
        playerTables.delete(userId);
      }
      console.log(`[Poker] ${username} disconnected`);
    });
  });

  return pokerNs;
}
