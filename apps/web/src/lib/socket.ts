import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';

let lobbySocket: Socket | null = null;

export function connectLobby(): Socket {
  if (lobbySocket?.connected) return lobbySocket;

  const token = useAuthStore.getState().token;

  lobbySocket = io('/lobby', {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  lobbySocket.on('connect', () => {
    console.log('[Socket] Connected to lobby');
  });

  lobbySocket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return lobbySocket;
}

export function disconnectLobby() {
  lobbySocket?.disconnect();
  lobbySocket = null;
}

export function getLobbySocket(): Socket | null {
  return lobbySocket;
}
