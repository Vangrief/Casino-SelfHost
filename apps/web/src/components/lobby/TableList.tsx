import { useNavigate } from 'react-router-dom';
import type { TableInfo } from '@casino/shared';
import { useAuthStore } from '../../stores/auth.store';
import { getLobbySocket } from '../../lib/socket';

interface TableListProps {
  tables: TableInfo[];
}

export function TableList({ tables }: TableListProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const navigate = useNavigate();

  const handleJoin = (tableId: string) => {
    getLobbySocket()?.emit('lobby:join_table', { tableId });
  };

  const handleLeave = (tableId: string) => {
    getLobbySocket()?.emit('lobby:leave_table', { tableId });
  };

  if (tables.length === 0) {
    return (
      <div className="bg-casino-surface border border-casino-border rounded-xl p-8 text-center text-gray-400">
        <p className="text-lg mb-1">Keine Tische vorhanden</p>
        <p className="text-sm">Erstelle einen neuen Tisch um loszulegen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tables.map((table) => {
        const isAtTable = table.players.some((p) => p.id === userId);
        const isFull = table.players.length >= table.maxPlayers;
        const gameLabel = table.gameType === 'blackjack' ? 'Blackjack' : 'Poker';

        return (
          <div
            key={table.id}
            className="bg-casino-surface border border-casino-border rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-white">{table.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-casino-felt text-casino-gold-light font-medium">
                  {gameLabel}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    table.status === 'waiting'
                      ? 'bg-green-900/40 text-green-400'
                      : 'bg-yellow-900/40 text-yellow-400'
                  }`}
                >
                  {table.status === 'waiting' ? 'Wartet' : 'Spielt'}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                <span>
                  {table.players.length}/{table.maxPlayers} Spieler
                </span>
                {table.gameType === 'blackjack' && (
                  <span className="ml-3">
                    Einsatz: {('minBet' in table.config ? table.config.minBet : 0).toLocaleString()} –{' '}
                    {('maxBet' in table.config ? table.config.maxBet : 0).toLocaleString()}
                  </span>
                )}
                {table.gameType === 'poker' && (
                  <span className="ml-3">
                    Blinds: {('smallBlind' in table.config ? table.config.smallBlind : 0).toLocaleString()}/
                    {('bigBlind' in table.config ? table.config.bigBlind : 0).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {table.players.map((p) => p.displayName).join(', ')}
              </div>
            </div>

            <div className="flex gap-2">
              {isAtTable ? (
                <>
                  <button
                    onClick={() => {
                      const route = table.gameType === 'blackjack' ? `/blackjack/${table.id}` : `/poker/${table.id}`;
                      navigate(route);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-green-700 text-white hover:bg-green-600 transition-colors"
                  >
                    Spielen
                  </button>
                  <button
                    onClick={() => handleLeave(table.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-casino-red/20 text-casino-red-light border border-casino-red/30 hover:bg-casino-red/30 transition-colors"
                  >
                    Verlassen
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleJoin(table.id)}
                  disabled={isFull}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-casino-gold text-black hover:bg-casino-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFull ? 'Voll' : 'Beitreten'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
