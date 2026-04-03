import { useEffect, useState } from 'react';
import { connectLobby, disconnectLobby } from '../lib/socket';

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

export function LobbyPage() {
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    const socket = connectLobby();

    socket.on('lobby:players_online', (data: { count: number; players: OnlinePlayer[] }) => {
      setOnlinePlayers(data.players);
    });

    socket.on('lobby:chat_message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-99), msg]);
    });

    return () => {
      disconnectLobby();
    };
  }, []);

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const socket = connectLobby();
    socket.emit('lobby:chat', { message: chatInput });
    setChatInput('');
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Area */}
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-2xl font-bold text-casino-gold">Lobby</h1>

        <div className="bg-casino-surface border border-casino-border rounded-xl p-8 text-center text-gray-400">
          <p className="text-lg mb-2">Tische kommen bald!</p>
          <p className="text-sm">Phase 2 wird die Tisch-Erstellung und das Beitreten ermöglichen.</p>
        </div>

        {/* Chat */}
        <div className="bg-casino-surface border border-casino-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-casino-border">
            <h2 className="font-semibold text-casino-gold">Chat</h2>
          </div>
          <div className="h-64 overflow-y-auto p-4 space-y-2">
            {chatMessages.length === 0 && (
              <p className="text-gray-500 text-sm text-center">Noch keine Nachrichten</p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span className="text-casino-gold font-medium">{msg.displayName}: </span>
                <span className="text-gray-300">{msg.message}</span>
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} className="border-t border-casino-border p-3 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nachricht schreiben..."
              maxLength={500}
              className="flex-1 bg-casino-bg border border-casino-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-casino-gold transition-colors"
            />
            <button
              type="submit"
              className="bg-casino-gold text-black font-medium px-4 py-1.5 rounded-lg text-sm hover:bg-casino-gold-light transition-colors"
            >
              Senden
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-casino-surface border border-casino-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-casino-border">
            <h2 className="font-semibold text-casino-gold">
              Online ({onlinePlayers.length})
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {onlinePlayers.length === 0 && (
              <p className="text-gray-500 text-sm">Verbinde...</p>
            )}
            {onlinePlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-300">{p.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
