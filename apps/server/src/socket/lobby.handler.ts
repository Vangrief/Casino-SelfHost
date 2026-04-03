import type { Server, Socket } from 'socket.io';
import type { AuthPayload } from '../middleware/auth.js';
import { query } from '../config/database.js';

interface LobbySocket extends Socket {
  data: {
    user: AuthPayload;
  };
}

const onlinePlayers = new Map<string, { id: string; username: string; displayName: string }>();

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

    onlinePlayers.set(userId, { id: userId, username, displayName });

    // Broadcast updated online players
    const playersList = Array.from(onlinePlayers.values());
    lobby.emit('lobby:players_online', {
      count: playersList.length,
      players: playersList,
    });

    console.log(`[Lobby] ${username} connected (${onlinePlayers.size} online)`);

    socket.on('lobby:chat', (data: { message: string }) => {
      if (!data.message || data.message.length > 500) return;
      lobby.emit('lobby:chat_message', {
        from: username,
        displayName,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      onlinePlayers.delete(userId);
      const updatedList = Array.from(onlinePlayers.values());
      lobby.emit('lobby:players_online', {
        count: updatedList.length,
        players: updatedList,
      });
      console.log(`[Lobby] ${username} disconnected (${onlinePlayers.size} online)`);
    });
  });

  return lobby;
}
