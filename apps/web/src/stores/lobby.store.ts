import { create } from 'zustand';
import type { TableInfo } from '@casino/shared';

interface OnlinePlayer {
  id: string;
  username: string;
  displayName: string;
}

interface ChatMessage {
  from: string;
  displayName: string;
  message: string;
  timestamp: string;
}

interface LobbyState {
  tables: TableInfo[];
  onlinePlayers: OnlinePlayer[];
  chatMessages: ChatMessage[];
  setTables: (tables: TableInfo[]) => void;
  setOnlinePlayers: (players: OnlinePlayer[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
}

export const useLobbyStore = create<LobbyState>()((set) => ({
  tables: [],
  onlinePlayers: [],
  chatMessages: [],
  setTables: (tables) => set({ tables }),
  setOnlinePlayers: (onlinePlayers) => set({ onlinePlayers }),
  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages.slice(-99), msg],
    })),
}));
