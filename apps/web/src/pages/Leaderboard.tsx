import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  total_games: number;
  total_hands: number;
  total_wins: number;
  total_wagered: string;
  total_won: string;
  total_lost: string;
  net_profit: string;
  biggest_win: string;
  best_streak: number;
}

type SortKey = 'net_profit' | 'total_wins' | 'total_games';

export function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('net_profit');
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    setLoading(true);
    api.get<LeaderboardEntry[]>(`/stats/leaderboard?orderBy=${sortBy}`)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sortBy]);

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'net_profit', label: 'Profit' },
    { key: 'total_wins', label: 'Siege' },
    { key: 'total_games', label: 'Spiele' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-casino-gold">Leaderboard</h1>
        <div className="flex gap-1 bg-casino-surface border border-casino-border rounded-lg p-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sortBy === opt.key
                  ? 'bg-casino-gold text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-10">Laden...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-gray-400 py-10">Noch keine Spieler</div>
      ) : (
        <div className="bg-casino-surface border border-casino-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-casino-border text-left text-sm text-gray-400">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Spieler</th>
                <th className="px-4 py-3 text-right">Spiele</th>
                <th className="px-4 py-3 text-right">Siege</th>
                <th className="px-4 py-3 text-right">Profit</th>
                <th className="px-4 py-3 text-right">Bester Win</th>
                <th className="px-4 py-3 text-right">Streak</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const isMe = entry.user_id === userId;
                const profit = parseInt(entry.net_profit, 10);

                return (
                  <tr
                    key={entry.user_id}
                    className={`border-b border-casino-border/50 ${
                      isMe ? 'bg-casino-gold/5' : 'hover:bg-casino-surface'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className={`font-bold ${i < 3 ? 'text-casino-gold' : 'text-gray-500'}`}>
                        {i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `${i + 1}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${isMe ? 'text-casino-gold' : 'text-white'}`}>
                        {entry.display_name}
                      </span>
                      {isMe && <span className="text-xs text-gray-400 ml-2">(Du)</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">{entry.total_games}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{entry.total_wins}</td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      profit > 0 ? 'text-green-400' : profit < 0 ? 'text-casino-red-light' : 'text-gray-400'
                    }`}>
                      {profit > 0 ? '+' : ''}{profit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-casino-gold-light">
                      {parseInt(entry.biggest_win, 10).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">{entry.best_streak}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
