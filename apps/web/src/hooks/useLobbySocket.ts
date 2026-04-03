import { useEffect } from 'react';
import { connectLobby, disconnectLobby } from '../lib/socket';
import { useLobbyStore } from '../stores/lobby.store';
import type { TableInfo } from '@casino/shared';

export function useLobbySocket() {
  const setTables = useLobbyStore((s) => s.setTables);
  const setOnlinePlayers = useLobbyStore((s) => s.setOnlinePlayers);
  const addChatMessage = useLobbyStore((s) => s.addChatMessage);

  useEffect(() => {
    const socket = connectLobby();

    socket.on('lobby:players_online', (data: { count: number; players: { id: string; username: string; displayName: string }[] }) => {
      setOnlinePlayers(data.players);
    });

    socket.on('lobby:tables_update', (tables: TableInfo[]) => {
      setTables(tables);
    });

    socket.on('lobby:chat_message', (msg: { from: string; displayName: string; message: string; timestamp: string }) => {
      addChatMessage(msg);
    });

    return () => {
      disconnectLobby();
    };
  }, [setTables, setOnlinePlayers, addChatMessage]);
}
