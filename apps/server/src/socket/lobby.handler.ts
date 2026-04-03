import type { Server, Socket } from 'socket.io';
import { createTableSchema, joinTableSchema, leaveTableSchema, lobbyChatSchema } from '@casino/shared';
import type { GameType } from '@casino/shared';
import type { AuthPayload } from '../middleware/auth.js';
import { query } from '../config/database.js';
import * as lobbyService from '../services/lobby.service.js';

interface LobbySocket extends Socket {
  data: {
    user: AuthPayload;
    displayName?: string;
  };
}

const onlinePlayers = new Map<string, { id: string; username: string; displayName: string; socketId: string }>();

function broadcastOnlinePlayers(lobby: ReturnType<Server['of']>) {
  const players = Array.from(onlinePlayers.values()).map(({ id, username, displayName }) => ({
    id,
    username,
    displayName,
  }));
  lobby.emit('lobby:players_online', { count: players.length, players });
}

function broadcastTables(lobby: ReturnType<Server['of']>) {
  lobby.emit('lobby:tables_update', lobbyService.listTables());
}

export function setupLobbyNamespace(io: Server) {
  const lobby = io.of('/lobby');

  lobby.on('connection', async (socket: LobbySocket) => {
    const { userId, username } = socket.data.user;

    // Fetch display name
    const result = await query<{ display_name: string }>(
      'SELECT display_name FROM users WHERE id = $1',
      [userId],
    );
    const displayName = result.rows[0]?.display_name || username;
    socket.data.displayName = displayName;

    onlinePlayers.set(userId, { id: userId, username, displayName, socketId: socket.id });

    broadcastOnlinePlayers(lobby);
    // Send current tables to newly connected player
    socket.emit('lobby:tables_update', lobbyService.listTables());

    console.log(`[Lobby] ${username} connected (${onlinePlayers.size} online)`);

    // --- Chat ---
    socket.on('lobby:chat', (data: unknown) => {
      const parsed = lobbyChatSchema.safeParse(data);
      if (!parsed.success) return;
      lobby.emit('lobby:chat_message', {
        from: username,
        displayName,
        message: parsed.data.message,
        timestamp: new Date().toISOString(),
      });
    });

    // --- Create Table ---
    socket.on('lobby:create_table', (data: unknown) => {
      const parsed = createTableSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit('game:error', { code: 'INVALID_INPUT', message: parsed.error.errors[0]?.message || 'Invalid input' });
        return;
      }

      const table = lobbyService.createTable(
        parsed.data.gameType as GameType,
        parsed.data.name,
        parsed.data.config as Record<string, unknown>,
        { id: userId, username, displayName },
      );

      socket.join(`table:${table.id}`);
      broadcastTables(lobby);

      lobby.emit('lobby:player_joined', {
        tableId: table.id,
        player: { id: userId, username, displayName },
      });
    });

    // --- Join Table ---
    socket.on('lobby:join_table', (data: unknown) => {
      const parsed = joinTableSchema.safeParse(data);
      if (!parsed.success) return;

      try {
        const table = lobbyService.joinTable(parsed.data.tableId, { id: userId, username, displayName });

        socket.join(`table:${table.id}`);
        broadcastTables(lobby);

        lobby.emit('lobby:player_joined', {
          tableId: table.id,
          player: { id: userId, username, displayName },
        });
      } catch (err) {
        socket.emit('game:error', {
          code: 'JOIN_FAILED',
          message: err instanceof Error ? err.message : 'Failed to join table',
        });
      }
    });

    // --- Leave Table ---
    socket.on('lobby:leave_table', (data: unknown) => {
      const parsed = leaveTableSchema.safeParse(data);
      if (!parsed.success) return;

      const table = lobbyService.leaveTable(parsed.data.tableId, userId);
      socket.leave(`table:${parsed.data.tableId}`);
      broadcastTables(lobby);

      lobby.emit('lobby:player_left', {
        tableId: parsed.data.tableId,
        player: { id: userId, username },
      });
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
      onlinePlayers.delete(userId);

      // Remove from all tables
      const affectedTables = lobbyService.removePlayerFromAllTables(userId);
      if (affectedTables.length > 0) {
        for (const tableId of affectedTables) {
          lobby.emit('lobby:player_left', {
            tableId,
            player: { id: userId, username },
          });
        }
        broadcastTables(lobby);
      }

      broadcastOnlinePlayers(lobby);
      console.log(`[Lobby] ${username} disconnected (${onlinePlayers.size} online)`);
    });
  });

  return lobby;
}
