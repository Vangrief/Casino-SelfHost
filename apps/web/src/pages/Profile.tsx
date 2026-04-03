import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';
import type { TransactionDTO, PaginatedResponse } from '@casino/shared';
import { ACHIEVEMENTS, type AchievementStats } from '@casino/shared';

interface PlayerStats {
  total_games: number;
  total_hands: number;
  total_wins: number;
  total_wagered: string;
  total_won: string;
  total_lost: string;
  net_profit: string;
  biggest_win: string;
  bj_hands: number;
  bj_wins: number;
  bj_blackjacks: number;
  poker_hands: number;
  poker_wins: number;
  poker_best_hand: string | null;
  current_streak: number;
  best_streak: number;
  worst_streak: number;
}

interface BalancePoint {
  index: number;
  balance: number;
  label: string;
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [balanceHistory, setBalanceHistory] = useState<BalancePoint[]>([]);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<PlayerStats>('/stats/me'),
      api.get<PaginatedResponse<TransactionDTO>>('/wallet/transactions?pageSize=100'),
    ]).then(([statsData, txData]) => {
      setStats(statsData);
      setTransactions(txData.data);

      // Build balance history from transactions (reverse chronological -> chronological)
      const reversed = [...txData.data].reverse();
      let balance = (user?.balance || 10000);
      // Walk backwards to find starting balance
      for (const tx of txData.data) {
        balance -= tx.amount;
      }

      const history: BalancePoint[] = [{ index: 0, balance, label: 'Start' }];
      reversed.forEach((tx, i) => {
        balance += tx.amount;
        history.push({
          index: i + 1,
          balance,
          label: new Date(tx.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        });
      });

      setBalanceHistory(history);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.balance]);

  if (loading || !stats) {
    return <div className="text-center text-gray-400 py-10">Laden...</div>;
  }

  const netProfit = parseInt(stats.net_profit, 10);
  const winRate = stats.total_hands > 0 ? ((stats.total_wins / stats.total_hands) * 100).toFixed(1) : '0';
  const bjWinRate = stats.bj_hands > 0 ? ((stats.bj_wins / stats.bj_hands) * 100).toFixed(1) : '0';
  const pokerWinRate = stats.poker_hands > 0 ? ((stats.poker_wins / stats.poker_hands) * 100).toFixed(1) : '0';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-casino-surface border border-casino-border rounded-xl p-6 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-casino-gold/20 flex items-center justify-center text-2xl font-bold text-casino-gold">
          {user?.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{user?.displayName}</h1>
          <p className="text-gray-400 text-sm">@{user?.username}</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-bold text-casino-gold">{user?.balance.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Chips</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Spiele" value={stats.total_games.toString()} />
        <StatCard label="Hände" value={stats.total_hands.toString()} />
        <StatCard label="Siege" value={stats.total_wins.toString()} />
        <StatCard label="Win-Rate" value={`${winRate}%`} />
        <StatCard
          label="Profit"
          value={`${netProfit > 0 ? '+' : ''}${netProfit.toLocaleString()}`}
          color={netProfit > 0 ? 'text-green-400' : netProfit < 0 ? 'text-casino-red-light' : undefined}
        />
        <StatCard label="Bester Win" value={parseInt(stats.biggest_win, 10).toLocaleString()} color="text-casino-gold" />
        <StatCard label="Beste Streak" value={stats.best_streak.toString()} color="text-green-400" />
        <StatCard label="Schlechteste Streak" value={stats.worst_streak.toString()} color="text-casino-red-light" />
      </div>

      {/* Game-specific stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-casino-surface border border-casino-border rounded-xl p-5">
          <h3 className="text-lg font-semibold text-casino-gold mb-3">Blackjack</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Hände</span><span className="text-white">{stats.bj_hands}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Siege</span><span className="text-white">{stats.bj_wins}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Blackjacks</span><span className="text-casino-gold">{stats.bj_blackjacks}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Win-Rate</span><span className="text-white">{bjWinRate}%</span></div>
          </div>
        </div>

        <div className="bg-casino-surface border border-casino-border rounded-xl p-5">
          <h3 className="text-lg font-semibold text-casino-gold mb-3">Poker</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Hände</span><span className="text-white">{stats.poker_hands}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Siege</span><span className="text-white">{stats.poker_wins}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Beste Hand</span><span className="text-casino-gold">{stats.poker_best_hand || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Win-Rate</span><span className="text-white">{pokerWinRate}%</span></div>
          </div>
        </div>
      </div>

      {/* Balance Chart */}
      {balanceHistory.length > 1 && (
        <div className="bg-casino-surface border border-casino-border rounded-xl p-5">
          <h3 className="text-lg font-semibold text-casino-gold mb-4">Balance-Verlauf</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={balanceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3a2a" />
              <XAxis dataKey="label" stroke="#666" tick={{ fontSize: 11 }} />
              <YAxis stroke="#666" tick={{ fontSize: 11 }} tickFormatter={(v) => Number(v).toLocaleString()} />
              <Tooltip
                contentStyle={{ backgroundColor: '#141a14', border: '1px solid #2a3a2a', borderRadius: '8px' }}
                labelStyle={{ color: '#d4a843' }}
                formatter={(value) => [Number(value).toLocaleString(), 'Chips']}
              />
              <Line type="monotone" dataKey="balance" stroke="#d4a843" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Achievements */}
      <div className="bg-casino-surface border border-casino-border rounded-xl p-5">
        <h3 className="text-lg font-semibold text-casino-gold mb-4">Achievements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((ach) => {
            const achievementStats: AchievementStats = {
              totalGames: stats.total_games,
              totalHands: stats.total_hands,
              totalWins: stats.total_wins,
              netProfit: parseInt(stats.net_profit, 10),
              biggestWin: parseInt(stats.biggest_win, 10),
              bjBlackjacks: stats.bj_blackjacks,
              bestStreak: stats.best_streak,
              worstStreak: stats.worst_streak,
              pokerBestHand: stats.poker_best_hand,
            };
            const unlocked = ach.check(achievementStats);

            return (
              <div
                key={ach.id}
                className={`rounded-xl border p-3 text-center transition-all ${
                  unlocked
                    ? 'border-casino-gold/40 bg-casino-gold/5'
                    : 'border-casino-border/50 opacity-40'
                }`}
                title={ach.description}
              >
                <div className="text-2xl mb-1">{ach.icon}</div>
                <div className={`text-xs font-medium ${unlocked ? 'text-casino-gold' : 'text-gray-500'}`}>
                  {ach.name}
                </div>
                <div className="text-[0.6rem] text-gray-500 mt-0.5">{ach.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-casino-surface border border-casino-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-casino-border">
          <h3 className="text-lg font-semibold text-casino-gold">Letzte Transaktionen</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="text-center text-gray-400 py-6 text-sm">Keine Transaktionen</div>
          ) : (
            <table className="w-full">
              <tbody>
                {transactions.slice(0, 30).map((tx) => (
                  <tr key={tx.id} className="border-b border-casino-border/30 text-sm">
                    <td className="px-5 py-2.5 text-gray-400">
                      {new Date(tx.createdAt).toLocaleString('de-DE', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-xs bg-casino-bg text-gray-300">
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs">{tx.gameType || ''}</td>
                    <td className={`px-5 py-2.5 text-right font-medium ${
                      tx.amount > 0 ? 'text-green-400' : tx.amount < 0 ? 'text-casino-red-light' : 'text-gray-400'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-casino-surface border border-casino-border rounded-xl p-4 text-center">
      <div className={`text-xl font-bold ${color || 'text-white'}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}
