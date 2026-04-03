import { useState } from 'react';
import { useLobbySocket } from '../hooks/useLobbySocket';
import { useLobbyStore } from '../stores/lobby.store';
import { TableList } from '../components/lobby/TableList';
import { CreateTableDialog } from '../components/lobby/CreateTableDialog';
import { OnlinePlayers } from '../components/lobby/OnlinePlayers';
import { LobbyChat } from '../components/lobby/LobbyChat';

export function LobbyPage() {
  const [showCreate, setShowCreate] = useState(false);
  useLobbySocket();

  const tables = useLobbyStore((s) => s.tables);
  const onlinePlayers = useLobbyStore((s) => s.onlinePlayers);
  const chatMessages = useLobbyStore((s) => s.chatMessages);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Area */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-casino-gold">Lobby</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-casino-gold text-black font-semibold px-4 py-2 rounded-lg hover:bg-casino-gold-light transition-colors"
          >
            + Neuer Tisch
          </button>
        </div>

        <TableList tables={tables} />
        <LobbyChat messages={chatMessages} />
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <OnlinePlayers players={onlinePlayers} />
      </div>

      <CreateTableDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
