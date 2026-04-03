import { useEffect, useState } from 'react';
import { getLobbySocket } from '../../lib/socket';

export function ConnectionStatus() {
  const [connected, setConnected] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const socket = getLobbySocket();
      if (socket) {
        setConnected(socket.connected);
        setReconnecting(!socket.connected && socket.active);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (connected) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-casino-surface border border-casino-border rounded-xl px-4 py-3 shadow-xl flex items-center gap-3">
      {reconnecting ? (
        <>
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-sm text-yellow-400">Verbindung wird wiederhergestellt...</span>
        </>
      ) : (
        <>
          <div className="w-3 h-3 bg-casino-red rounded-full" />
          <span className="text-sm text-casino-red-light">Verbindung getrennt</span>
        </>
      )}
    </div>
  );
}
