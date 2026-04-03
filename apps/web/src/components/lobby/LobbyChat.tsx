import { useState, useRef, useEffect } from 'react';
import { getLobbySocket } from '../../lib/socket';

interface ChatMessage {
  from: string;
  displayName: string;
  message: string;
  timestamp: string;
}

interface LobbyChatProps {
  messages: ChatMessage[];
}

export function LobbyChat({ messages }: LobbyChatProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    getLobbySocket()?.emit('lobby:chat', { message: input });
    setInput('');
  };

  return (
    <div className="bg-casino-surface border border-casino-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-casino-border">
        <h2 className="font-semibold text-casino-gold">Chat</h2>
      </div>
      <div className="h-64 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm text-center">Noch keine Nachrichten</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="text-sm">
            <span className="text-casino-gold font-medium">{msg.displayName}: </span>
            <span className="text-gray-300">{msg.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendChat} className="border-t border-casino-border p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
  );
}
